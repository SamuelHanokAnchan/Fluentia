import json

def sample_json_data(data):
    # Take first project type
    sampled = {
        "projectTypes": [data["projectTypes"][0].copy()]
    }
    
    # Take first 2 tools
    sampled["projectTypes"][0]["tools"] = sampled["projectTypes"][0]["tools"][:2]
    
    # Take first subtool for each tool
    for tool in sampled["projectTypes"][0]["tools"]:
        if "subTools" in tool and len(tool["subTools"]) > 0:
            tool["subTools"] = tool["subTools"][:1]
    
    return sampled

# Load original data
with open('json/data.json') as f:
    original_data = json.load(f)

# Create sample
sampled_data = sample_json_data(original_data)

# Save sampled data
with open('sampled_data.json', 'w') as f:
    json.dump(sampled_data, f, indent=2)

print("Sample created with:")
print(f"- 1 project type")
print(f"- 2 tools")
print(f"- 1 subtool per tool (where available)")