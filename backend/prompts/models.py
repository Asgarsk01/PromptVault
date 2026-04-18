from django.conf import settings
from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Prompt(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    complexity = models.IntegerField(
        default=1,
        help_text="Complexity level from 1 (simple) to 10 (complex)"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='prompts')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class PromptLike(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prompt_likes',
    )
    prompt = models.ForeignKey(
        Prompt,
        on_delete=models.CASCADE,
        related_name='likes',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user} likes {self.prompt}'

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'prompt'], name='unique_prompt_like')
        ]


class PromptBookmark(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prompt_bookmarks',
    )
    prompt = models.ForeignKey(
        Prompt,
        on_delete=models.CASCADE,
        related_name='bookmarks',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user} bookmarked {self.prompt}'

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'prompt'], name='unique_prompt_bookmark')
        ]
