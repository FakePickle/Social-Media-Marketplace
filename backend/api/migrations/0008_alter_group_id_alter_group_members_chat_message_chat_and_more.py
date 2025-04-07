# Generated by Django 5.2 on 2025-04-07 17:13

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_friendship_is_accepted'),
    ]

    operations = [
        migrations.AlterField(
            model_name='group',
            name='id',
            field=models.AutoField(primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='group',
            name='members',
            field=models.ManyToManyField(null=True, related_name='group_members', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='Chat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user1', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chats_as_user1', to=settings.AUTH_USER_MODEL)),
                ('user2', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chats_as_user2', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='message',
            name='chat',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='api.chat'),
        ),
        migrations.AddConstraint(
            model_name='chat',
            constraint=models.UniqueConstraint(fields=('user1', 'user2'), name='unique_user_chat'),
        ),
    ]
