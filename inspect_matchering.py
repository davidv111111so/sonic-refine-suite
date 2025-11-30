import matchering as mg
import inspect

print("--- mg.process arguments ---")
try:
    print(inspect.signature(mg.process))
except Exception as e:
    print(e)

print("\n--- mg.Config attributes (if exists) ---")
try:
    # Try to find a Config class or similar
    if hasattr(mg, 'Config'):
        print(dir(mg.Config))
        print(inspect.signature(mg.Config))
    else:
        print("No mg.Config found")
except Exception as e:
    print(e)

print("\n--- mg attributes ---")
print(dir(mg))
