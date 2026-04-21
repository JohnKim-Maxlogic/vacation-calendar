import React, { useEffect, useRef } from "react";
import { VacationEntry, UserInfo, LeaveType } from "../types";

interface Props {
  currentUser: UserInfo;
  initialStart?: string;
  initialEnd?: string;
  editEntry?: VacationEntry;
  onSave: (entry: Omit<VacationEntry, "id">) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Omit<VacationEntry, "id">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function VacationForm({
  currentUser,
  initialStart = "",
  initialEnd = "",
  editEntry,
  onSave,
  onUpdate,
  onDelete,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [displayName, setDisplayName] = React.useState(
    editEntry?.userDisplayName ?? currentUser.userDisplayName
  );
  const [startDate, setStartDate] = React.useState(editEntry?.startDate ?? initialStart);
  const [endDate, setEndDate] = React.useState(editEntry?.endDate ?? initialEnd);
  const [leaveType, setLeaveType] = React.useState<LeaveType>(
    editEntry?.leaveType ?? "연차"
  );
  const [note, setNote] = React.useState(editEntry?.note ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const isOwner = !editEntry || editEntry.userId === currentUser.userId;
  const isHalfDay = leaveType === "반차오전" || leaveType === "반차오후";

  // 반차는 하루만 가능 — 시작일이 바뀌면 종료일도 맞춤
  const handleStartChange = (val: string) => {
    setStartDate(val);
    if (isHalfDay) setEndDate(val);
  };

  const handleLeaveTypeChange = (val: LeaveType) => {
    setLeaveType(val);
    const isNowHalfDay = val === "반차오전" || val === "반차오후";
    if (isNowHalfDay) setEndDate(startDate); // 반차: 종료일 = 시작일
  };

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleSave = async () => {
    if (!displayName.trim()) { setError("이름을 입력해주세요."); return; }
    if (!startDate) { setError("시작일을 입력해주세요."); return; }
    if (!isHalfDay && !endDate) { setError("종료일을 입력해주세요."); return; }
    if (!isHalfDay && endDate < startDate) { setError("종료일이 시작일보다 빠를 수 없습니다."); return; }

    setSubmitting(true);
    setError("");
    const finalEnd = isHalfDay ? startDate : endDate;
    try {
      if (editEntry) {
        await onUpdate(editEntry.id, {
          userDisplayName: displayName.trim(),
          startDate,
          endDate: finalEnd,
          leaveType,
          note: note || undefined,
        });
      } else {
        await onSave({
          userId: currentUser.userId,
          userDisplayName: displayName.trim(),
          startDate,
          endDate: finalEnd,
          leaveType,
          note: note || undefined,
          color: userColor(currentUser.userId),
        });
      }
      onClose();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editEntry) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSubmitting(true);
    try {
      await onDelete(editEntry.id);
      onClose();
    } catch {
      setError("삭제 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="vacation-dialog" onClick={handleBackdropClick}>
      <div className="vacation-dialog-inner">
        <h2>{editEntry ? "휴가 수정" : "휴가 추가"}</h2>
        {error && <p className="form-error">{error}</p>}

        <label>
          이름
          <input
            type="text"
            value={displayName}
            disabled={!isOwner}
            placeholder="팀원 이름"
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <fieldset className="leave-type-fieldset">
          <legend>휴가 유형</legend>
          <div className="leave-type-options">
            <label className="radio-label">
              <input
                type="radio"
                name="leaveType"
                value="연차"
                checked={leaveType === "연차"}
                disabled={!isOwner}
                onChange={() => handleLeaveTypeChange("연차")}
              />
              연차
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="leaveType"
                value="반차오전"
                checked={leaveType === "반차오전"}
                disabled={!isOwner}
                onChange={() => handleLeaveTypeChange("반차오전")}
              />
              반차 (오전)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="leaveType"
                value="반차오후"
                checked={leaveType === "반차오후"}
                disabled={!isOwner}
                onChange={() => handleLeaveTypeChange("반차오후")}
              />
              반차 (오후)
            </label>
          </div>
        </fieldset>

        <label>
          {isHalfDay ? "날짜" : "시작일"}
          <input
            type="date"
            value={startDate}
            disabled={!isOwner}
            onChange={(e) => handleStartChange(e.target.value)}
          />
        </label>

        {!isHalfDay && (
          <label>
            종료일
            <input
              type="date"
              value={endDate}
              disabled={!isOwner}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        )}

        <label>
          메모 (선택)
          <input
            type="text"
            value={note}
            disabled={!isOwner}
            placeholder="예: 여름 휴가"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {!isOwner && (
          <p className="readonly-notice">
            {editEntry?.userDisplayName}님의 항목은 수정할 수 없습니다.
          </p>
        )}

        {confirmDelete ? (
          <div className="delete-confirm">
            <p>정말 삭제하시겠습니까?</p>
            <div className="form-actions">
              <button className="btn-danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? "삭제 중..." : "삭제 확인"}
              </button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)} disabled={submitting}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="form-actions">
            {isOwner && editEntry && (
              <button className="btn-danger" onClick={handleDelete} disabled={submitting}>
                삭제
              </button>
            )}
            <button className="btn-secondary" onClick={onClose} disabled={submitting}>
              취소
            </button>
            {isOwner && (
              <button className="btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? "저장 중..." : "저장"}
              </button>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}

const COLORS = [
  "#6264A7", "#13a10e", "#e74856", "#0078d4",
  "#ff8c00", "#00b7c3", "#8764b8", "#c19c00",
  "#e3008c", "#00ad56",
];

export function userColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}
