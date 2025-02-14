from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.core.files.storage import FileSystemStorage

# Register new user
def register(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            return JsonResponse({"message": "User registered successfully."}, status=201)
    else:
        form = UserCreationForm()
    return render(request, "register.html", {"form": form})

# Login user
def login_user(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({"message": "Login successful."})
        else:
            return JsonResponse({"message": "Invalid credentials."}, status=400)
    return JsonResponse({"message": "Invalid request."}, status=400)

# Logout user
def logout_user(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully."})

# Profile Management (Update username and profile picture)
@login_required
def update_profile(request):
    if request.method == "POST":
        user = request.user
        username = request.POST.get("username")
        profile_pic = request.FILES.get("profile_pic")

        if username:
            user.username = username
            user.save()

        if profile_pic:
            fs = FileSystemStorage()
            filename = fs.save(profile_pic.name, profile_pic)
            user.profile.profile_pic = filename  # Assuming Profile model exists
            user.profile.save()

        return JsonResponse({"message": "Profile updated successfully."})

    return JsonResponse({"message": "Invalid request."}, status=400)
