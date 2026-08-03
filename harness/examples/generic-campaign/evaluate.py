import json
import math
import os
from pathlib import Path


candidate = json.loads(Path("candidate.json").read_text(encoding="utf-8"))
parameter = float(candidate["parameter"])
target = 1.75
score = math.exp(-((parameter - target) ** 2))
output = {
    "schemaVersion": 1,
    "status": "valid" if math.isfinite(score) else "invalid",
    "summary": "Candidate scored against a fixed bounded function.",
    "metrics": [{"name": "primary_score", "value": score, "unit": "normalized score"}],
    "checks": [
        {"name": "finite result", "status": "pass" if math.isfinite(score) else "fail"},
        {
            "name": "within declared bounds",
            "status": "pass" if 0.0 <= parameter <= 3.0 else "fail",
        },
    ],
    "limitations": ["This is a harness smoke example, not a scientific result."],
}
output_dir = Path(os.environ["RADAR_OUTPUT_DIR"])
output_dir.mkdir(parents=True, exist_ok=True)
(output_dir / "evaluation.json").write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
