"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  CloudSun,
  CircleHelp,
  Filter,
  Clock3,
  Save,
  StickyNote,
  Sun,
  UsersRound,
  X
} from "lucide-react";

import { FAMILY_ROW_DEFINITIONS } from "@/lib/family-groups";
import { getHolidayCalloutsForWeekend } from "@/lib/holidays";
import { canSetJaneForecast, DEFAULT_JANE_FORECAST, JANE_FORECAST_META } from "@/lib/jane-factor";
import { STATUS_META } from "@/lib/status-display";
import {
  AvailabilityStatus,
  JaneForecast,
  JANE_FORECAST_VALUES,
  MemberPayload,
  SeasonPayload,
  STATUS_VALUES
} from "@/types/planner";

type HighlightKey = "everyoneFree" | "mostFree" | "needsResponses" | "myFree" | "myBusy";

type AvailabilityUpdate = {
  memberId: string;
  weekendId: string;
  status: AvailabilityStatus;
  note: string;
  janeForecast: JaneForecast | null;
};

type EditorTarget = {
  rowId: string;
  weekendId: string;
};

type FamilyRow = {
  id: string;
  label: string;
  members: MemberPayload[];
};

type PlannerAppProps = {
  currentMember: MemberPayload;
  initialPayload: SeasonPayload;
};

const HIGHLIGHTS: Array<{
  key: HighlightKey;
  label: string;
  icon: typeof CheckCircle2;
}> = [
  { key: "everyoneFree", label: "Everyone free", icon: CheckCircle2 },
  { key: "mostFree", label: "Most free", icon: UsersRound },
  { key: "needsResponses", label: "Needs responses", icon: CircleHelp },
  { key: "myFree", label: "My free", icon: CheckCircle2 },
  { key: "myBusy", label: "My busy", icon: Clock3 }
];

const JANE_FORECAST_ICONS: Record<JaneForecast, typeof CloudSun> = {
  sunny_with_jane: Sun,
  partly_janey: CloudSun,
  jane_unclear: CircleHelp,
  no_jane_expected: CloudOff
};

export function PlannerApp({ currentMember, initialPayload }: PlannerAppProps) {
  const [payload, setPayload] = useState(initialPayload);
  const [activeHighlight, setActiveHighlight] = useState<HighlightKey | null>(null);
  const [rowFilter, setRowFilter] = useState("all");
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const familyRows = useMemo(() => buildFamilyRows(payload.members), [payload.members]);

  const selectedContext = useMemo(() => {
    if (!editor) {
      return null;
    }

    const row = familyRows.find((candidate) => candidate.id === editor.rowId);
    const weekend = payload.weekends.find((candidate) => candidate.id === editor.weekendId);

    if (!row || !weekend) {
      return null;
    }

    return {
      row,
      weekend,
      cells: row.members.map((member) => ({
        member,
        cell: payload.availability[member.id][weekend.id]
      }))
    };
  }, [editor, familyRows, payload]);

  const visibleRows = useMemo(() => {
    if (rowFilter === "all") {
      return familyRows;
    }

    return familyRows.filter((row) => row.id === rowFilter);
  }, [familyRows, rowFilter]);

  function toggleHighlight(key: HighlightKey) {
    setActiveHighlight((current) => (current === key ? null : key));
  }

  function weekendIsHighlighted(weekendId: string) {
    const weekend = payload.weekends.find((candidate) => candidate.id === weekendId);
    const myStatus = payload.availability[currentMember.id]?.[weekendId]?.status;

    if (!weekend) {
      return false;
    }

    if (activeHighlight === "everyoneFree") {
      return weekend.flags.everyoneFree;
    }

    if (activeHighlight === "mostFree") {
      return weekend.flags.mostFree;
    }

    if (activeHighlight === "needsResponses") {
      return weekend.flags.needsResponses;
    }

    if (activeHighlight === "myFree") {
      return myStatus === "free";
    }

    if (activeHighlight === "myBusy") {
      return myStatus === "busy";
    }

    return false;
  }

  function canEdit(memberId: string) {
    return currentMember.isOrganizer || memberId === currentMember.id;
  }

  function canEditRow(row: FamilyRow) {
    return currentMember.isOrganizer || row.members.some((member) => member.id === currentMember.id);
  }

  async function saveAvailability(updates: AvailabilityUpdate[]) {
    setSaveError(null);
    let nextPayload: SeasonPayload | null = null;

    for (const update of updates) {
      const response = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberId: update.memberId,
          weekendId: update.weekendId,
          status: update.status,
          note: update.note,
          janeForecast: update.janeForecast
        })
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaveError(result?.error ?? "Could not save availability.");
        return;
      }

      nextPayload = (await response.json()) as SeasonPayload;
    }

    if (nextPayload) {
      setPayload(nextPayload);
    }
  }

  return (
    <main className="planner-shell">
      <header className="planner-topbar">
        <div>
          <p className="eyebrow">Active season</p>
          <h1>{payload.season.name}</h1>
          <p className="season-range">
            {formatDate(payload.season.startDate)} to {formatDate(payload.season.endDate)}
          </p>
        </div>
        <div className="member-actions">
          <span
            className="current-member"
            aria-label={`Signed in as ${currentMember.displayName}${
              currentMember.isOrganizer ? ", organizer" : ""
            }`}
          >
            <span className="member-dot" style={{ background: currentMember.color ?? "#64748b" }} />
            <span>{currentMember.firstName}</span>
            {currentMember.isOrganizer ? <span className="role-badge">Organizer</span> : null}
          </span>
        </div>
      </header>

      <section className="toolbar" aria-label="Highlight controls">
        <div className="highlight-buttons">
          {HIGHLIGHTS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className="toggle-button"
              type="button"
              aria-pressed={activeHighlight === key}
              data-active={activeHighlight === key}
              onClick={() => toggleHighlight(key)}
            >
              <Icon aria-hidden="true" size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="planner-workspace" aria-label="Availability planner">
        <div className="table-frame">
          <table className="availability-table">
            <caption className="sr-only">Weekend availability by family member</caption>
            <thead>
              <tr>
                <th className="sticky-member member-header" scope="col">
                  <label className="family-filter-label" htmlFor="member-filter">
                    <span>Family</span>
                    <span className="family-filter-control">
                      <Filter aria-hidden="true" size={14} />
                      <select
                        id="member-filter"
                        value={rowFilter}
                        onChange={(event) => {
                          setRowFilter(event.target.value);
                          setEditor(null);
                        }}
                        aria-label="Filter family rows"
                      >
                        <option value="all">All</option>
                        {familyRows.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                </th>
                {payload.weekends.map((weekend) => {
                  const holidays = getHolidayCalloutsForWeekend(weekend.startDate, weekend.endDate);
                  const WeekendJaneIcon = weekend.janeFactor ? JANE_FORECAST_ICONS[weekend.janeFactor.forecast] : null;

                  return (
                    <th
                      key={weekend.id}
                      className={
                        weekendIsHighlighted(weekend.id) ? "weekend-header highlighted-column" : "weekend-header"
                      }
                      scope="col"
                    >
                      <span className="weekend-label">{weekend.label}</span>
                      <span
                        className={holidays.length > 0 ? "holiday-callouts" : "holiday-callouts empty"}
                        aria-label={holidayLabel(holidays)}
                      >
                        {holidays.length > 0 ? (
                          holidays.map((holiday) => (
                            <span key={`${holiday.scope}:${holiday.date}:${holiday.label}`} className="holiday-pill">
                              {formatHolidayPill(holiday)}
                            </span>
                          ))
                        ) : null}
                      </span>
                      {weekend.janeFactor && WeekendJaneIcon ? (
                        <span
                          className="weekend-jane-factor-icon"
                          data-forecast={weekend.janeFactor.forecast}
                          title={`From ${weekend.janeFactor.sourceNames.join(" and ")}: ${
                            JANE_FORECAST_META[weekend.janeFactor.forecast].label
                          }`}
                          aria-label={`Jane Factor, ${JANE_FORECAST_META[weekend.janeFactor.forecast].label}`}
                        >
                          <WeekendJaneIcon aria-hidden="true" size={16} />
                          <span className="jane-factor-tooltip" role="tooltip">
                            {JANE_FORECAST_META[weekend.janeFactor.forecast].factorLabel}
                          </span>
                        </span>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <th className="sticky-member member-name" scope="row">
                    <span className="grouped-member-name">{row.label}</span>
                  </th>
                  {payload.weekends.map((weekend) => {
                    const rowState = getFamilyRowWeekendState(row, weekend.id, payload);
                    const editable = canEditRow(row);
                    const JaneIcon = rowState.janeForecast ? JANE_FORECAST_ICONS[rowState.janeForecast] : null;

                    return (
                      <td
                        key={weekend.id}
                        className={weekendIsHighlighted(weekend.id) ? "highlighted-column" : undefined}
                      >
                        <button
                          className={`availability-cell ${rowState.isSplit ? "status-split" : `status-${rowState.status}`}`}
                          type="button"
                          data-readonly={!editable}
                          aria-disabled={!editable}
                          aria-label={`${row.label}, ${weekend.label}: ${rowState.accessibleLabel}`}
                          onClick={() => setEditor({ rowId: row.id, weekendId: weekend.id })}
                        >
                          {rowState.isSplit ? (
                            <span className="split-cell-values">
                              {rowState.memberStates.map(({ member, status }) => (
                                <span key={member.id}>
                                  {member.firstName}: {STATUS_META[status].shortLabel}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span>{STATUS_META[rowState.status].shortLabel}</span>
                          )}
                          {rowState.noteText || rowState.janeForecastText ? (
                            <span className="cell-indicators">
                              {rowState.janeForecastText && rowState.janeForecast && JaneIcon ? (
                                <span
                                  className="jane-cell-icon"
                                  data-forecast={rowState.janeForecast}
                                  title={rowState.janeForecastText}
                                  aria-label={rowState.janeForecastText}
                                >
                                  <JaneIcon aria-hidden="true" size={15} />
                                  <span className="jane-cell-tooltip" role="tooltip">
                                    {rowState.janeForecastText}
                                  </span>
                                </span>
                              ) : null}
                              {rowState.noteText ? (
                                <span
                                  className="note-indicator"
                                  title={rowState.noteText}
                                  aria-label={`Note: ${rowState.noteText}`}
                                >
                                  <StickyNote aria-hidden="true" size={14} />
                                  <span className="note-tooltip" role="tooltip">
                                    {rowState.noteText}
                                  </span>
                                </span>
                              ) : null}
                            </span>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CellEditor
          key={
            selectedContext
              ? `${selectedContext.row.id}:${selectedContext.weekend.id}:${selectedContext.cells
                  .map(({ cell }) => `${cell.updatedAt ?? "new"}:${cell.janeForecast ?? "none"}`)
                  .join(":")}`
              : "empty"
          }
          context={selectedContext}
          canSave={Boolean(selectedContext && canEditRow(selectedContext.row))}
          error={saveError}
          onClose={() => {
            setEditor(null);
            setSaveError(null);
          }}
          onSave={saveAvailability}
        />
      </section>
    </main>
  );
}

function buildFamilyRows(members: MemberPayload[]): FamilyRow[] {
  const membersByFirstName = new Map(members.map((member) => [member.firstName, member]));
  const usedMemberIds = new Set<string>();
  const rows: FamilyRow[] = [];

  for (const firstNames of FAMILY_ROW_DEFINITIONS) {
    const rowMembers = firstNames
      .map((firstName) => membersByFirstName.get(firstName))
      .filter((member): member is MemberPayload => Boolean(member));

    if (rowMembers.length === 0) {
      continue;
    }

    for (const member of rowMembers) {
      usedMemberIds.add(member.id);
    }

    rows.push({
      id: rowMembers.map((member) => member.id).join(":"),
      label: rowMembers.map((member) => member.firstName).join(" & "),
      members: rowMembers
    });
  }

  for (const member of members) {
    if (usedMemberIds.has(member.id)) {
      continue;
    }

    rows.push({
      id: member.id,
      label: member.firstName,
      members: [member]
    });
  }

  return rows;
}

function getFamilyRowWeekendState(row: FamilyRow, weekendId: string, payload: SeasonPayload) {
  const memberStates = row.members.map((member) => ({
    member,
    status: payload.availability[member.id][weekendId].status,
    note: payload.availability[member.id][weekendId].note?.trim() ?? "",
    janeForecast:
      payload.availability[member.id][weekendId].status === "free"
        ? payload.availability[member.id][weekendId].janeForecast
        : null
  }));
  const statuses = new Set(memberStates.map(({ status }) => status));
  const notes = new Set(memberStates.map(({ note }) => note));
  const janeForecasts = new Set(memberStates.map(({ janeForecast }) => janeForecast ?? ""));
  const isSplit = statuses.size > 1 || notes.size > 1 || janeForecasts.size > 1;
  const status = memberStates[0]?.status ?? "unknown";
  const noteText = isSplit
    ? memberStates
        .filter(({ note }) => note)
        .map(({ member, note }) => (row.members.length > 1 ? `${member.firstName}: ${note}` : note))
        .join("\n")
    : memberStates[0]?.note ?? "";
  const janeForecastStates = memberStates.filter(
    (state): state is (typeof memberStates)[number] & { janeForecast: JaneForecast } => Boolean(state.janeForecast)
  );
  const janeForecastText = janeForecastStates
    .map(({ member, janeForecast }) =>
      row.members.length > 1
        ? `${member.firstName}: ${JANE_FORECAST_META[janeForecast].label}`
        : JANE_FORECAST_META[janeForecast].factorLabel
    )
    .join("\n");
  const firstJaneForecast = janeForecastStates[0]?.janeForecast;

  return {
    isSplit,
    status,
    noteText,
    janeForecastText,
    janeForecast: firstJaneForecast,
    memberStates,
    accessibleLabel: [
      isSplit
        ? memberStates.map(({ member, status }) => `${member.firstName} ${STATUS_META[status].label}`).join(", ")
        : STATUS_META[status].label,
      noteText ? `note: ${noteText}` : null,
      janeForecastText || null
    ]
      .filter(Boolean)
      .join(", ")
  };
}

function CellEditor({
  context,
  canSave,
  error,
  onClose,
  onSave
}: {
  context: {
    row: FamilyRow;
    weekend: SeasonPayload["weekends"][number];
    cells: Array<{
      member: MemberPayload;
      cell: SeasonPayload["availability"][string][string];
    }>;
  } | null;
  canSave: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (updates: AvailabilityUpdate[]) => Promise<void>;
}) {
  const initialStatuses = new Set(context?.cells.map(({ cell }) => cell.status) ?? ["unknown"]);
  const initialNotes = new Set(context?.cells.map(({ cell }) => cell.note ?? "") ?? [""]);
  const initialJaneForecasts = new Set(context?.cells.map(({ cell }) => cell.janeForecast ?? "") ?? [""]);
  const startsSplit =
    (context?.cells.length ?? 0) > 1 &&
    (initialStatuses.size > 1 || initialNotes.size > 1 || initialJaneForecasts.size > 1);
  const [mode, setMode] = useState<"together" | "individual">(startsSplit ? "individual" : "together");
  const [status, setStatus] = useState<AvailabilityStatus>(context?.cells[0]?.cell.status ?? "unknown");
  const [note, setNote] = useState(initialNotes.size === 1 ? context?.cells[0]?.cell.note ?? "" : "");
  const [janeForecast, setJaneForecast] = useState<JaneForecast>(
    initialJaneForecasts.size === 1 && context?.cells[0]?.cell.janeForecast
      ? context.cells[0].cell.janeForecast
      : DEFAULT_JANE_FORECAST
  );
  const [individualValues, setIndividualValues] = useState(() =>
    Object.fromEntries(
      (context?.cells ?? []).map(({ member, cell }) => [
        member.id,
        {
          status: cell.status,
          note: cell.note ?? "",
          janeForecast: cell.janeForecast ?? DEFAULT_JANE_FORECAST
        }
      ])
    ) as Record<string, { status: AvailabilityStatus; note: string; janeForecast: JaneForecast }>
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!context) {
    return (
      <aside className="cell-editor empty" aria-label="Availability editor">
        <p className="toolbar-label">Cell details</p>
        <p>Select one of your availability cells to update status or add a note.</p>
      </aside>
    );
  }

  async function handleSave() {
    if (!context) {
      return;
    }

    setIsSaving(true);
    await onSave(
      mode === "together"
        ? context.row.members.map((member) => ({
            memberId: member.id,
            weekendId: context.weekend.id,
            status,
            note,
            janeForecast: janeForecastForMember(member, status, janeForecast)
          }))
        : context.row.members.map((member) => ({
            memberId: member.id,
            weekendId: context.weekend.id,
            status: individualValues[member.id].status,
            note: individualValues[member.id].note,
            janeForecast: janeForecastForMember(
              member,
              individualValues[member.id].status,
              individualValues[member.id].janeForecast
            )
          }))
    );
    setIsSaving(false);
  }

  return (
    <aside className="cell-editor" aria-label="Availability editor">
      <div className="editor-header">
        <div>
          <p className="eyebrow">{context.weekend.label}</p>
          <h2>{context.row.label}</h2>
        </div>
        <button className="icon-only-button" type="button" aria-label="Close editor" onClick={onClose}>
          <X aria-hidden="true" size={18} />
        </button>
      </div>

      {context.row.members.length > 1 ? (
        <div className="editor-mode-toggle" role="group" aria-label="Couple edit mode">
          <button type="button" data-active={mode === "together"} onClick={() => setMode("together")}>
            Together
          </button>
          <button type="button" data-active={mode === "individual"} onClick={() => setMode("individual")}>
            Individual
          </button>
        </div>
      ) : null}

      {mode === "together" ? (
        <>
          <StatusPicker value={status} disabled={!canSave || isSaving} onChange={setStatus} />
          <JaneForecastPicker
            memberNames={context.row.members
              .filter((member) => canSetJaneForecast(member.firstName))
              .map((member) => member.firstName)}
            status={status}
            value={janeForecast}
            disabled={!canSave || isSaving}
            onChange={setJaneForecast}
          />
          <label className="note-label" htmlFor="availability-note">
            Note
          </label>
          <textarea
            id="availability-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={!canSave || isSaving}
            maxLength={240}
            placeholder="Optional context"
          />
          <div className="editor-meta">
            <span>{note.length}/240</span>
            <span>{latestUpdateLabel(context.cells)}</span>
          </div>
        </>
      ) : (
        <div className="individual-editor-list">
          {context.cells.map(({ member, cell }) => {
            const values = individualValues[member.id];

            return (
              <section className="individual-editor" key={member.id} aria-label={`${member.firstName} availability`}>
                <h3>{member.firstName}</h3>
                <StatusPicker
                  value={values.status}
                  disabled={!canSave || isSaving}
                  onChange={(nextStatus) =>
                    setIndividualValues((current) => ({
                      ...current,
                      [member.id]: {
                        ...current[member.id],
                        status: nextStatus
                      }
                    }))
                  }
                />
                <JaneForecastPicker
                  memberNames={canSetJaneForecast(member.firstName) ? [member.firstName] : []}
                  status={values.status}
                  value={values.janeForecast}
                  disabled={!canSave || isSaving}
                  onChange={(nextForecast) =>
                    setIndividualValues((current) => ({
                      ...current,
                      [member.id]: {
                        ...current[member.id],
                        janeForecast: nextForecast
                      }
                    }))
                  }
                />
                <label className="note-label" htmlFor={`availability-note-${member.id}`}>
                  Note
                </label>
                <textarea
                  id={`availability-note-${member.id}`}
                  value={values.note}
                  onChange={(event) =>
                    setIndividualValues((current) => ({
                      ...current,
                      [member.id]: {
                        ...current[member.id],
                        note: event.target.value
                      }
                    }))
                  }
                  disabled={!canSave || isSaving}
                  maxLength={240}
                  placeholder="Optional context"
                />
                <div className="editor-meta">
                  <span>{values.note.length}/240</span>
                  <span>{cell.updatedAt ? `Updated ${formatDateTime(cell.updatedAt)}` : "No update yet"}</span>
                </div>
              </section>
            );
          })}
        </div>
      )}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" type="button" onClick={handleSave} disabled={!canSave || isSaving}>
        <Save aria-hidden="true" size={18} />
        {isSaving ? "Saving" : "Save availability"}
      </button>
    </aside>
  );
}

function StatusPicker({
  value,
  disabled,
  onChange
}: {
  value: AvailabilityStatus;
  disabled: boolean;
  onChange: (status: AvailabilityStatus) => void;
}) {
  return (
    <fieldset className="status-fieldset" disabled={disabled}>
      <legend>Status</legend>
      <div className="status-options">
        {STATUS_VALUES.map((status) => (
          <button
            key={status}
            className={`status-choice status-${status}`}
            type="button"
            aria-pressed={value === status}
            data-active={value === status}
            onClick={() => onChange(status)}
          >
            <span>{STATUS_META[status].label}</span>
            <small>{STATUS_META[status].description}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function JaneForecastPicker({
  memberNames,
  status,
  value,
  disabled,
  onChange
}: {
  memberNames: string[];
  status: AvailabilityStatus;
  value: JaneForecast;
  disabled: boolean;
  onChange: (forecast: JaneForecast) => void;
}) {
  if (status !== "free" || memberNames.length === 0) {
    return null;
  }

  return (
    <fieldset className="jane-forecast-fieldset" disabled={disabled}>
      <legend>
        <Cloud aria-hidden="true" size={15} />
        Jane Forecast
      </legend>
      <div className="jane-forecast-options">
        {JANE_FORECAST_VALUES.map((forecast) => {
          const Icon = JANE_FORECAST_ICONS[forecast];
          const meta = JANE_FORECAST_META[forecast];

          return (
            <button
              key={forecast}
              className="jane-forecast-choice"
              type="button"
              aria-pressed={value === forecast}
              data-active={value === forecast}
              data-forecast={forecast}
              onClick={() => onChange(forecast)}
            >
              <Icon aria-hidden="true" size={17} />
              <span>{meta.label}</span>
              <small>{meta.description}</small>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function janeForecastForMember(member: MemberPayload, status: AvailabilityStatus, forecast: JaneForecast) {
  return status === "free" && canSetJaneForecast(member.firstName) ? forecast : null;
}

function latestUpdateLabel(cells: Array<{ cell: SeasonPayload["availability"][string][string] }>) {
  const latest = cells
    .map(({ cell }) => cell.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return latest ? `Updated ${formatDateTime(latest)}` : "No update yet";
}

function holidayLabel(holidays: ReturnType<typeof getHolidayCalloutsForWeekend>) {
  if (holidays.length === 0) {
    return "No holiday nearby";
  }

  return holidays.map((holiday) => `${holiday.label} on ${formatDate(holiday.date)}`).join("; ");
}

function formatHolidayPill(holiday: ReturnType<typeof getHolidayCalloutsForWeekend>[number]) {
  return `${holiday.label} (${new Date(`${holiday.date}T00:00:00.000Z`).getUTCDate()})`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
