from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = "Creates a superuser if one does not exist for the given email."

    def handle(self, *args, **options):
        User = get_user_model()
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "StrongPassword123")

        if not User.objects.filter(email=email).exists():
            user = User.objects.create_superuser(email=email, password=password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Superuser {email} created with password."))
        else:
            self.stdout.write(self.style.WARNING(f"Superuser {email} already exists."))
