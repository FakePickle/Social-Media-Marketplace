# Generated by Django 5.1.7 on 2025-04-06 12:52

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_alter_customuser_options_alter_customuser_managers_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="customuser",
            name="private_key",
        ),
        migrations.RemoveField(
            model_name="customuser",
            name="public_key",
        ),
    ]
