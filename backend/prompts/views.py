import redis
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Count, Exists, OuterRef, Q
from django.http import JsonResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Prompt, PromptBookmark, PromptLike, Tag

User = get_user_model()

CURATED_TRENDING_TAGS = [
    ('midjourney', 'Midjourney'),
    ('ui/ux', 'UI/UX'),
    ('editorial', 'Editorial'),
    ('3d-render', '3D-Render'),
    ('cyberpunk', 'Cyberpunk'),
    ('hyper-real', 'Hyper-Real'),
    ('minimalism', 'Minimalism'),
]
CURATED_TRENDING_TAG_NAMES = [tag for tag, _ in CURATED_TRENDING_TAGS]
CURATED_TRENDING_TAG_LABELS = dict(CURATED_TRENDING_TAGS)
MAX_PROMPT_TAGS = 4

redis_client = redis.Redis.from_url(
    settings.CACHES['default']['LOCATION'],
    decode_responses=True
)


def clamp_limit(raw_value, default=12, minimum=1, maximum=50):
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(value, maximum))


def clamp_page(raw_value, default=1):
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return default
    return max(1, value)


def normalize_tag_name(tag_name):
    return str(tag_name).strip().lower()


def format_tag_name(tag_name):
    normalized = normalize_tag_name(tag_name)
    return CURATED_TRENDING_TAG_LABELS.get(normalized, normalized.title())


def split_full_name(full_name):
    cleaned = str(full_name).strip()
    if not cleaned:
        return '', ''

    parts = cleaned.split()
    if len(parts) == 1:
        return parts[0], ''

    return parts[0], ' '.join(parts[1:])


def serialize_user(user):
    full_name = user.get_full_name().strip()
    display_name = full_name or user.username

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': full_name,
        'display_name': display_name,
    }


def get_prompt_queryset(user=None):
    queryset = Prompt.objects.prefetch_related('tags').annotate(
        like_count=Count('likes', distinct=True),
        bookmark_count=Count('bookmarks', distinct=True),
    )

    if user and user.is_authenticated:
        queryset = queryset.annotate(
            liked_by_current_user=Exists(
                PromptLike.objects.filter(user=user, prompt_id=OuterRef('pk'))
            ),
            bookmarked_by_current_user=Exists(
                PromptBookmark.objects.filter(user=user, prompt_id=OuterRef('pk'))
            ),
        )

    return queryset


def apply_prompt_filters(queryset, request):
    tag_filter = request.query_params.get('tag')
    search_term = str(request.query_params.get('search', '')).strip()

    if tag_filter:
        queryset = queryset.filter(tags__name__iexact=tag_filter)

    if search_term:
        queryset = queryset.filter(
            Q(title__icontains=search_term)
            | Q(content__icontains=search_term)
            | Q(tags__name__icontains=search_term)
        )

    return queryset.distinct(), tag_filter or '', search_term


def get_view_counts(prompts):
    if not prompts:
        return {}

    keys = [f'prompt:views:{prompt.id}' for prompt in prompts]
    values = redis_client.mget(keys)

    return {
        prompt.id: int(values[index] or 0)
        for index, prompt in enumerate(prompts)
    }


def percentage(part, whole):
    if not whole:
        return 0
    return round((part / whole) * 100)


def blended_percentage(primary_part, primary_whole, secondary_part, secondary_whole, primary_weight=0.7):
    primary_score = percentage(primary_part, primary_whole)
    secondary_score = percentage(secondary_part, secondary_whole)
    secondary_weight = 1 - primary_weight
    return round((primary_score * primary_weight) + (secondary_score * secondary_weight))


def get_curated_prompt_tags(prompt):
    tags = []

    for tag in prompt.tags.all():
        normalized = normalize_tag_name(tag.name)
        if normalized not in CURATED_TRENDING_TAG_NAMES:
            continue

        tags.append({
            'id': tag.id,
            'name': format_tag_name(normalized),
            'slug': normalized,
        })

    tags.sort(
        key=lambda item: (
            CURATED_TRENDING_TAG_NAMES.index(item['slug']),
            item['name'],
        )
    )

    return tags[:MAX_PROMPT_TAGS]


def prompt_to_dict(prompt, view_count=0):
    return {
        'id': prompt.id,
        'title': prompt.title,
        'content': prompt.content,
        'complexity': prompt.complexity,
        'tags': get_curated_prompt_tags(prompt),
        'created_at': prompt.created_at.isoformat(),
        'view_count': int(view_count),
        'like_count': int(getattr(prompt, 'like_count', 0) or 0),
        'bookmark_count': int(getattr(prompt, 'bookmark_count', 0) or 0),
        'liked_by_current_user': bool(getattr(prompt, 'liked_by_current_user', False)),
        'bookmarked_by_current_user': bool(getattr(prompt, 'bookmarked_by_current_user', False)),
    }


def build_paginated_prompt_response(queryset, request):
    page = clamp_page(request.query_params.get('page'))
    limit = clamp_limit(request.query_params.get('limit'))
    total = queryset.count()
    start = (page - 1) * limit
    end = start + limit
    prompts = list(queryset[start:end])
    view_counts = get_view_counts(prompts)
    results = [prompt_to_dict(prompt, view_counts.get(prompt.id, 0)) for prompt in prompts]

    return {
        'results': results,
        'page': page,
        'limit': limit,
        'total': total,
        'has_more': end < total,
    }


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        body = request.data
        full_name = str(body.get('full_name', '')).strip()
        email = str(body.get('email', '')).strip().lower()
        username = str(body.get('username', '')).strip()
        password = str(body.get('password', ''))

        errors = {}

        if len(full_name) < 2:
            errors['full_name'] = 'Full name must be at least 2 characters.'

        if '@' not in email or '.' not in email.split('@')[-1]:
            errors['email'] = 'A valid email is required.'
        elif User.objects.filter(email__iexact=email).exists():
            errors['email'] = 'Email is already in use.'

        if len(username) < 3:
            errors['username'] = 'Username must be at least 3 characters.'
        elif User.objects.filter(username__iexact=username).exists():
            errors['username'] = 'Username is already in use.'

        if len(password) < 8:
            errors['password'] = 'Password must be at least 8 characters.'

        if errors:
            return Response({'errors': errors}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        first_name, last_name = split_full_name(full_name)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'user': serialize_user(user),
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class PromptVaultTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['display_name'] = user.get_full_name().strip() or user.username
        return token

    def validate(self, attrs):
        identifier = str(attrs.get(self.username_field, '')).strip()
        password = attrs.get('password')

        if '@' in identifier:
            matched_user = User.objects.filter(email__iexact=identifier).first()
            if matched_user:
                identifier = matched_user.username

        data = super().validate({
            self.username_field: identifier,
            'password': password,
        })
        data['user'] = serialize_user(self.user)
        return data


class PromptVaultTokenObtainPairView(TokenObtainPairView):
    serializer_class = PromptVaultTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        refresh_token = str(request.data.get('refresh', '')).strip()

        if not refresh_token:
            return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'error': 'Invalid refresh token.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Signed out successfully.'}, status=status.HTTP_200_OK)


class PromptListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        queryset, _, _ = apply_prompt_filters(get_prompt_queryset(request.user), request)
        return Response(build_paginated_prompt_response(queryset, request), status=status.HTTP_200_OK)

    def post(self, request):
        body = request.data
        title = str(body.get('title', '')).strip()
        content = str(body.get('content', '')).strip()
        complexity = body.get('complexity')
        tag_names = body.get('tags', [])

        errors = {}

        if len(title) < 3:
            errors['title'] = 'Title must be at least 3 characters.'

        if len(content) < 20:
            errors['content'] = 'Content must be at least 20 characters.'

        if complexity is None:
            errors['complexity'] = 'Complexity is required.'
        else:
            try:
                complexity = int(complexity)
                if not (1 <= complexity <= 10):
                    errors['complexity'] = 'Complexity must be between 1 and 10.'
            except (TypeError, ValueError):
                errors['complexity'] = 'Complexity must be a valid integer.'

        if not isinstance(tag_names, list):
            errors['tags'] = 'Tags must be sent as an array.'
        elif len(tag_names) > MAX_PROMPT_TAGS:
            errors['tags'] = f'Choose at most {MAX_PROMPT_TAGS} tags.'
        elif any(normalize_tag_name(tag_name) not in CURATED_TRENDING_TAG_NAMES for tag_name in tag_names):
            errors['tags'] = 'Only the curated trending tags are supported.'

        if errors:
            return Response({'errors': errors}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        prompt = Prompt.objects.create(
            title=title,
            content=content,
            complexity=complexity,
        )

        for tag_name in tag_names:
            normalized = normalize_tag_name(tag_name)
            if not normalized:
                continue
            tag, _ = Tag.objects.get_or_create(name=normalized)
            prompt.tags.add(tag)

        prompt = get_prompt_queryset(request.user).get(pk=prompt.pk)
        return Response(prompt_to_dict(prompt), status=status.HTTP_201_CREATED)


class PromptDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            prompt = get_prompt_queryset(request.user).get(pk=pk)
        except Prompt.DoesNotExist:
            return Response({'error': 'Prompt not found'}, status=status.HTTP_404_NOT_FOUND)

        redis_key = f'prompt:views:{pk}'
        redis_client.incr(redis_key)
        view_count = redis_client.get(redis_key) or 0

        return Response(prompt_to_dict(prompt, view_count), status=status.HTTP_200_OK)


class TagListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tags = Tag.objects.filter(name__in=CURATED_TRENDING_TAG_NAMES).annotate(prompt_count=Count('prompts', distinct=True))
        tag_map = {tag.name: tag for tag in tags}
        data = [
            {
                'id': tag_map[tag_name].id if tag_name in tag_map else 0,
                'name': format_tag_name(tag_name),
                'prompt_count': int(tag_map[tag_name].prompt_count) if tag_name in tag_map else 0,
            }
            for tag_name in CURATED_TRENDING_TAG_NAMES
        ]
        return Response(data, status=status.HTTP_200_OK)


class PromptLikeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        prompt = Prompt.objects.filter(pk=pk).first()
        if not prompt:
            return Response({'error': 'Prompt not found'}, status=status.HTTP_404_NOT_FOUND)

        PromptLike.objects.get_or_create(user=request.user, prompt=prompt)
        prompt = get_prompt_queryset(request.user).get(pk=pk)
        view_count = get_view_counts([prompt]).get(prompt.id, 0)
        return Response(prompt_to_dict(prompt, view_count), status=status.HTTP_200_OK)

    def delete(self, request, pk):
        prompt = Prompt.objects.filter(pk=pk).first()
        if not prompt:
            return Response({'error': 'Prompt not found'}, status=status.HTTP_404_NOT_FOUND)

        PromptLike.objects.filter(user=request.user, prompt=prompt).delete()
        prompt = get_prompt_queryset(request.user).get(pk=pk)
        view_count = get_view_counts([prompt]).get(prompt.id, 0)
        return Response(prompt_to_dict(prompt, view_count), status=status.HTTP_200_OK)


class PromptBookmarkView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        prompt = Prompt.objects.filter(pk=pk).first()
        if not prompt:
            return Response({'error': 'Prompt not found'}, status=status.HTTP_404_NOT_FOUND)

        PromptBookmark.objects.get_or_create(user=request.user, prompt=prompt)
        prompt = get_prompt_queryset(request.user).get(pk=pk)
        view_count = get_view_counts([prompt]).get(prompt.id, 0)
        return Response(prompt_to_dict(prompt, view_count), status=status.HTTP_200_OK)

    def delete(self, request, pk):
        prompt = Prompt.objects.filter(pk=pk).first()
        if not prompt:
            return Response({'error': 'Prompt not found'}, status=status.HTTP_404_NOT_FOUND)

        PromptBookmark.objects.filter(user=request.user, prompt=prompt).delete()
        prompt = get_prompt_queryset(request.user).get(pk=pk)
        view_count = get_view_counts([prompt]).get(prompt.id, 0)
        return Response(prompt_to_dict(prompt, view_count), status=status.HTTP_200_OK)


class BookmarkListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset, _, _ = apply_prompt_filters(
            get_prompt_queryset(request.user).filter(bookmarks__user=request.user),
            request,
        )
        return Response(build_paginated_prompt_response(queryset, request), status=status.HTTP_200_OK)


class AnalyticsOverviewView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        all_prompts = get_prompt_queryset(request.user)
        filtered_prompts, selected_tag, _ = apply_prompt_filters(all_prompts, request)

        total_prompt_count = all_prompts.count()
        prompt_count = filtered_prompts.count()

        all_prompt_ids = list(all_prompts.values_list('id', flat=True))
        filtered_prompt_ids = list(filtered_prompts.values_list('id', flat=True))

        all_view_total = sum(get_view_counts(list(all_prompts)).values()) if total_prompt_count else 0
        selected_view_total = sum(get_view_counts(list(filtered_prompts)).values()) if prompt_count else 0

        all_like_total = PromptLike.objects.filter(prompt_id__in=all_prompt_ids).count() if all_prompt_ids else 0
        selected_like_total = (
            PromptLike.objects.filter(prompt_id__in=filtered_prompt_ids).count() if filtered_prompt_ids else 0
        )

        all_bookmark_total = (
            PromptBookmark.objects.filter(prompt_id__in=all_prompt_ids).count() if all_prompt_ids else 0
        )
        selected_bookmark_total = (
            PromptBookmark.objects.filter(prompt_id__in=filtered_prompt_ids).count() if filtered_prompt_ids else 0
        )

        if selected_tag:
            trending_percent = percentage(prompt_count, total_prompt_count)
            most_viewed_percent = percentage(selected_view_total, all_view_total)
            most_liked_percent = percentage(selected_like_total, all_like_total)
            saved_progress = percentage(
                selected_bookmark_total,
                max(all_bookmark_total, total_prompt_count),
            )
        else:
            tag_prompt_counts = []
            tag_view_totals = []
            tag_like_totals = []

            for tag_name in CURATED_TRENDING_TAG_NAMES:
                tag_prompts = list(all_prompts.filter(tags__name__iexact=tag_name).distinct())
                if not tag_prompts:
                    continue

                tag_prompt_ids = [prompt.id for prompt in tag_prompts]
                tag_prompt_counts.append(len(tag_prompts))
                tag_view_totals.append(sum(get_view_counts(tag_prompts).values()))
                tag_like_totals.append(
                    PromptLike.objects.filter(prompt_id__in=tag_prompt_ids).count()
                )

            trending_percent = percentage(max(tag_prompt_counts, default=0), total_prompt_count)
            top_view_total = max(tag_view_totals, default=0)
            top_view_index = tag_view_totals.index(top_view_total) if tag_view_totals else None
            top_view_prompt_count = tag_prompt_counts[top_view_index] if top_view_index is not None else 0

            top_like_total = max(tag_like_totals, default=0)
            top_like_index = tag_like_totals.index(top_like_total) if tag_like_totals else None
            top_like_prompt_count = tag_prompt_counts[top_like_index] if top_like_index is not None else 0

            most_viewed_percent = blended_percentage(
                top_view_total,
                all_view_total,
                top_view_prompt_count,
                total_prompt_count,
            )
            most_liked_percent = blended_percentage(
                top_like_total,
                all_like_total,
                top_like_prompt_count,
                total_prompt_count,
            )
            saved_progress = percentage(all_bookmark_total, total_prompt_count)

        return Response(
            {
                'selected_tag': selected_tag or 'All',
                'prompt_count': prompt_count,
                'view_total': selected_view_total,
                'like_total': selected_like_total,
                'bookmark_total': selected_bookmark_total,
                'trending_percent': trending_percent,
                'most_viewed_percent': most_viewed_percent,
                'most_liked_percent': most_liked_percent,
                'saved_count': selected_bookmark_total,
                'saved_progress': saved_progress,
                'available_tags': [format_tag_name(tag_name) for tag_name in CURATED_TRENDING_TAG_NAMES],
            },
            status=status.HTTP_200_OK,
        )


def healthcheck(request):
    return JsonResponse({'status': 'ok'})
