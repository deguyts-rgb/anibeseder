#!/bin/bash
sed -i "s|__FIREBASE_API_KEY__|${FIREBASE_API_KEY}|g" index.html
sed -i "s|__FIREBASE_APP_ID__|${FIREBASE_APP_ID}|g" index.html
echo "Done"
