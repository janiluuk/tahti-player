# Monitoring container logs → Admin Logs

**Status:** open

## Goal

Remove the embedded container logs panel from Admin → Monitoring. Logs stay
on Admin → Logs (Containers tab); Monitoring keeps deep links (Full logs page
/ App logs per service).

## Done in this PR

- Strip `ContainerLogsPanel` from `AdminMonitoringView`
- Story asserts no “Container logs (all services)” heading; Full logs + App
  logs links remain
- Version bump 0.0.395
