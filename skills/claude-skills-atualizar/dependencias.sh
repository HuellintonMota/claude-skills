#!/usr/bin/env bash
tem git && dep_ok "git" "$(git --version)" || dep_sistema "git" "Git.Git" "git" "git"
