"""
Configuration for EduAid backend model optimization.
"""
import os

# Model quantization configuration
# Set to True to enable model quantization for reduced memory usage and faster inference
ENABLE_MODEL_QUANTIZATION = os.getenv('ENABLE_MODEL_QUANTIZATION', 'False').lower() == 'true'

# Precision mode: 'int8' for CPU quantization, 'fp16' for GPU half-precision
MODEL_PRECISION = os.getenv('MODEL_PRECISION', 'int8').lower()
