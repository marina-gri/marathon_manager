# Generated by Django 5.1.3 on 2024-12-17 14:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0004_alter_sessioninfo_pilot_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='sessioninfo',
            name='fact_length',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='Фактическая продолжительность'),
        ),
    ]
