#!/bin/bash

# Run linkedinScraper.py
echo "Running linkedinScraper.py..."
python3 linkedinScraper.py
echo "Waiting for 30 seconds..."
sleep 60

# Run githubScraper.py
echo "Running githubScraper.py..."
python3 githubScraper.py
echo "Waiting for 30 seconds..."
sleep 60

# Run cleanUp.py
echo "Running cleanUp.py..."
python3 cleanUp.py
