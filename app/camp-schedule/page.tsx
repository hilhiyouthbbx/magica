"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────
type RowType = "section" | "normal" | "break" | "game" | "highlight";

interface ScheduleRow {
  id: string;
  time: string;
  activity: string;
  note: string;
  type: RowType;
}

interface DayData {
  label: string;
  date: string;
  theme: string;
  rows: ScheduleRow[];
}
