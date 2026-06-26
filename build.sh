#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python social_network/manage.py collectstatic --no-input
python social_network/manage.py migrate