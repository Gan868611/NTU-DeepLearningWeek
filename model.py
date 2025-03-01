import torch
import torch.nn as nn

class HeartDiseaseNN(nn.Module):
    def __init__(self, input_dim):
        super(HeartDiseaseNN, self).__init__()
        self.fc1 = nn.Linear(input_dim, 128)  # First hidden layer
        self.bn1 = nn.BatchNorm1d(128)  # Batch Normalization
        self.fc2 = nn.Linear(128, 64)  # Second hidden layer
        self.bn2 = nn.BatchNorm1d(64)
        self.fc3 = nn.Linear(64, 32)  # Third hidden layer
        self.bn3 = nn.BatchNorm1d(32)
        self.fc4 = nn.Linear(32, 1)  # Output layer
        self.dropout = nn.Dropout(0.3)  # Dropout for regularization
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()  # Sigmoid for binary classification

    def forward(self, x):
        x = self.relu(self.bn1(self.fc1(x)))
        x = self.dropout(x)
        x = self.relu(self.bn2(self.fc2(x)))
        x = self.dropout(x)
        x = self.relu(self.bn3(self.fc3(x)))
        x = self.dropout(x)
        x = self.sigmoid(self.fc4(x))  # Sigmoid activation at output
        return x