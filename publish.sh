#!/bin/bash

git add .
read -p "Commit message: " commit_message
git commit -m "$commit_message"
