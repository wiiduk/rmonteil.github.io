#!/bin/bash

current_branch=$(git rev-parse --abbrev-ref HEAD)
read -p "Commit message: " commit_message

git add .
git commit -m "$commit_message"
git checkout master
git pull origin master
git merge $current_branch
git push origin master
