from django.urls import path
from .views import (
    AnalyticsOverviewView,
    BookmarkListView,
    PromptBookmarkView,
    PromptDetailView,
    PromptLikeView,
    PromptListView,
    TagListView,
)

urlpatterns = [
    path('prompts/', PromptListView.as_view(), name='prompt-list'),
    path('prompts/<int:pk>/', PromptDetailView.as_view(), name='prompt-detail'),
    path('prompts/<int:pk>/like/', PromptLikeView.as_view(), name='prompt-like'),
    path('prompts/<int:pk>/bookmark/', PromptBookmarkView.as_view(), name='prompt-bookmark'),
    path('bookmarks/', BookmarkListView.as_view(), name='bookmark-list'),
    path('tags/', TagListView.as_view(), name='tag-list'),
    path('analytics/overview/', AnalyticsOverviewView.as_view(), name='analytics-overview'),
]
