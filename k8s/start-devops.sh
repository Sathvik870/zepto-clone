#!/bin/bash

echo "🚀 Starting DevOps Environment..."

# Step 1: Start Minikube
echo "👉 Starting Minikube..."
minikube start --driver=docker

# Step 2: Set kubectl context
echo "👉 Setting kubectl context..."
kubectl config use-context minikube

# Step 3: Check cluster
echo "👉 Checking cluster..."
kubectl get nodes

# Step 4: Start Jenkins container
echo "👉 Starting Jenkins..."
docker start jenkins || echo "⚠️ Jenkins container not found. Start manually."

# Step 5: Wait for pods
echo "👉 Waiting for pods to stabilize..."
sleep 10

# Step 6: Show running pods
echo "👉 Current Pods:"
kubectl get pods -A

# Step 7: Start ArgoCD UI port-forward
echo "👉 Starting ArgoCD UI (https://localhost:8081)..."
kubectl port-forward svc/argocd-server -n argocd 8081:443 &

# Step 8: Start your app service
echo "👉 Opening your app..."
minikube service zepto-service

echo "✅ DevOps Environment Ready!"
