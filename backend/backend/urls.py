from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from prompts.views import LogoutView, PromptVaultTokenObtainPairView, SignupView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/signup/', SignupView.as_view(), name='signup'),
    path('api/auth/token/', PromptVaultTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/', include('prompts.urls')),
]
