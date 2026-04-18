from django.contrib import admin
from .models import Prompt, PromptBookmark, PromptLike, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']


@admin.register(Prompt)
class PromptAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'complexity', 'created_at']
    list_filter = ['complexity', 'tags']
    search_fields = ['title', 'content']
    filter_horizontal = ['tags']


@admin.register(PromptLike)
class PromptLikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'prompt', 'created_at']
    search_fields = ['user__username', 'prompt__title']


@admin.register(PromptBookmark)
class PromptBookmarkAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'prompt', 'created_at']
    search_fields = ['user__username', 'prompt__title']
