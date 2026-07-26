"""Illustrative compilation of cli-expired-session.scenario.md.

The fixtures and command name are fictional. Use the host repository's runner,
credential fixture, and documented exit codes in a real compilation.
"""


def test_cli_expired_session_preserves_config(
    cli_runner,
    fake_api,
    expired_credentials,
    tmp_path,
):
    project = tmp_path / "orchid-cli-demo"
    project.mkdir()
    config = project / "project.toml"
    config.write_text('name = "orchid-cli-demo"\nregion = "test-1"\n')
    original_config = config.read_bytes()

    result = cli_runner.run(
        ["deploy", "--dry-run"],
        cwd=project,
        credentials=expired_credentials,
        api=fake_api,
    )

    assert result.exit_code == cli_runner.exit_codes.AUTH_REQUIRED
    assert "Run `tool auth login` to continue." in result.stderr
    assert config.read_bytes() == original_config
    assert fake_api.deployment_requests == []
