### Description
This is deepseek-ai/DeepSeek-R1-Distill-Qwen-7B model converted to the OpenVINO™ IR (Intermediate Representation) format with weights compressed to INT4 by NNCF.

### Quantization Parameters
Weight compression was performed using nncf.compress_weights with the following parameters:

- mode: INT4_SYM
- group_size: 128
- ratio: 1.0