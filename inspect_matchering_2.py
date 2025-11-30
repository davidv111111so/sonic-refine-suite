import matchering as mg
try:
    c = mg.Config()
    print("--- Config Attributes ---")
    for k, v in c.__dict__.items():
        print(f"{k}: {v}")
except Exception as e:
    print(e)
