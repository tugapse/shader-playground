import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EngineLogger } from "src/engine/logger";

interface LogEntry {
  level: string;
  message: string;
  timestamp: number;
}

@Component({
  selector: "editor-problems-panel",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./problems-panel.html",
  styleUrls: ["./problems-panel.scss"],
})
export class OmegaLoggerPanelComponent implements OnInit, OnDestroy {
  public logs: LogEntry[] = [];
  public selectedLevel: string = "all";
  public expandedIndices = new Set<number>();
  private pollInterval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.refreshLogs();
    this.pollInterval = setInterval(() => {
      this.refreshLogs();
    }, 250);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  private refreshLogs() {
    const currentLogs = EngineLogger.getLogs();
    if (currentLogs.length !== this.logs.length) {
      this.logs = [...currentLogs];
      this.cdr.markForCheck();
    }
  }

  public get filteredLogs() {
    if (this.selectedLevel === "all") {
      return this.logs;
    }
    return this.logs.filter((log) => log.level === this.selectedLevel);
  }

  public clearLogs() {
    EngineLogger.clear();
    this.logs = [];
    this.expandedIndices.clear();
  }

  public toggleExpand(index: number) {
    if (this.expandedIndices.has(index)) {
      this.expandedIndices.delete(index);
    } else {
      this.expandedIndices.add(index);
    }
  }

  public hasStackTrace(message: string): boolean {
    return message.includes("\n    at ");
  }

  public getLogSummary(message: string): string {
    const splitIdx = message.indexOf("\n    at ");
    return splitIdx === -1 ? message : message.substring(0, splitIdx);
  }

  public getStackTrace(message: string): string {
    const splitIdx = message.indexOf("\n    at ");
    return splitIdx === -1 ? "" : message.substring(splitIdx + 1);
  }
}
