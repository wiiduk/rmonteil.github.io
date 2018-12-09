#!/bin/bash

current_branch=$(git rev-parse --abbrev-ref HEAD)
read -p "Commit message: " commit_message

git add .
git commit -m "$commit_message"
git checkout develop
git pull origin develop
git merge $current_branch
git push origin develop
