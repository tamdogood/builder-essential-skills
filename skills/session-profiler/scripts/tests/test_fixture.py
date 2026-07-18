from pathlib import Path
import gzip
import json
import os
import tempfile

from session_profiler.analyses import brief
from session_profiler.dataset import load, load_agents, parse
from session_profiler.trace import create


fixture = Path(__file__).parent / "fixture" / "main.jsonl"
with tempfile.TemporaryDirectory() as tmp:
    out = parse(fixture, tmp)
    df = load(out)
    agents = load_agents(out)["agents"]
    assert len(agents) == 2
    assert agents[1]["parent_agent_id"] == "main"
    m1 = df[(df.event_type == "inference") & (df.message_id == "m1")].iloc[0]
    assert m1.output_tokens == 15, "usage must use final message snapshot exactly once"
    assert len(df[(df.event_type == "tool") & df.concurrent]) == 2
    assert bool(df[(df.event_type == "tool") & (df.tool_use_id == "tool-1")].iloc[0].is_error)
    assert "## At a glance" in brief(out)
    trace_path = create(out)
    assert trace_path.exists()
    with gzip.open(trace_path, "rt", encoding="utf-8") as fh:
        trace = json.load(fh)
    names = {event.get("name") for event in trace["traceEvents"]}
    track_names = {event.get("args", {}).get("name") for event in trace["traceEvents"]}
    assert "Session overview" in track_names
    assert "usage tokens" in names
print("fixture ok")

hermes_home = Path(__file__).parent / "hermes_home"
hermes_fixture = hermes_home / "sessions" / "2026" / "01" / "01" / "rollout-root.jsonl"
previous = os.environ.get("HERMES_HOME")
os.environ["HERMES_HOME"] = str(hermes_home)
try:
    with tempfile.TemporaryDirectory() as tmp:
        out = parse(hermes_fixture, tmp)
        df = load(out)
        metadata = load_agents(out)
        assert metadata["provider"] == "hermes"
        assert len(metadata["agents"]) == 2
        assert metadata["agents"][1]["parent_agent_id"] == "main"
        assert metadata["agents"][1]["spawn_tool_use_id"] == "call-spawn"
        first = df[(df.event_type == "inference") & (df.agent_id == "main")].iloc[0]
        assert first.input_tokens == 60 and first.cache_read_input_tokens == 40
        assert first.estimated_cost_usd > 0
        assert df[df.event_type == "tool"].iloc[0].duration_ms == 2000
        assert "Provider: `hermes`" in brief(out)
        assert create(out).exists()
finally:
    if previous is None:
        os.environ.pop("HERMES_HOME", None)
    else:
        os.environ["HERMES_HOME"] = previous
print("hermes fixture ok")
