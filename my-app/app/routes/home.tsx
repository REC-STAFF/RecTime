// routes/home.tsx
import type { Route } from "./+types/home";
import { useEffect, useMemo, useState } from "react";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Rectime PWA" },
    { name: "description", content: "学籍番号でデータ取得" },
  ];
}

type Status = "idle" | "no-id" | "loading" | "ok" | "error";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// 테이블定義 최소 스키마
type StudentRow = {
  f_student_id: string;
  f_class?: string | null;
  f_number?: string | null;
  f_name?: string | null;
};
type EventRow = {
  f_event_id: string;
  f_event_name: string | null;
  f_start_time: string | null; // "HHmm"
  f_duration: string | null;
  f_place: string | null;
  f_gather_time: string | null; // "HHmm"
  f_summary: string | null;
};
type Payload = { m_students: StudentRow; t_events: EventRow[] };

const HHMM = /^([01]\d|2[0-3])[0-5]\d$/;
function isValidPayload(x: any): x is Payload {
  return (
    x &&
    typeof x === "object" &&
    x.m_students &&
    typeof x.m_students.f_student_id === "string" &&
    Array.isArray(x.t_events) &&
    x.t_events.every(
      (ev: any) =>
        typeof ev.f_event_id === "string" &&
        (ev.f_start_time === null ||
          (typeof ev.f_start_time === "string" &&
            HHMM.test(ev.f_start_time))) &&
        (ev.f_gather_time === null ||
          (typeof ev.f_gather_time === "string" && HHMM.test(ev.f_gather_time)))
    )
  );
}

// localStorage 키
const LS_KEY_ID = "student:id";
const LS_KEY_STUDENT = (id: string) => `student:master:${id}`;
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST = "student:payload:last";

function getStudentId(): string | null {
  return localStorage.getItem(LS_KEY_ID);
}
function setStudentId(id: string) {
  localStorage.setItem(LS_KEY_ID, id);
}

// API / mock 폴백
async function fetchByGakuseki(id: string): Promise<Payload> {
  const url = `${API_BASE}/download?gakusekino=${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    if (!isValidPayload(data)) throw new Error("invalid payload");
    return data;
  } catch {
    const mock = await fetch("/mock.json");
    if (!mock.ok) throw new Error(`mock ${mock.status}`);
    const data = await mock.json();
    if (!isValidPayload(data)) throw new Error("invalid mock payload");
    return data;
  }
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [inputId, setInputId] = useState("");
  const studentId = useMemo(() => getStudentId(), [status]);

  useEffect(() => {
    setStatus(studentId ? "idle" : "no-id");
  }, [studentId]);

  async function handleSaveId() {
    const id = inputId.trim();
    // 숫자만 요구 시
    if (!/^\d+$/.test(id)) {
      alert("学籍番号（数字）を入力してください");
      return;
    }
    setStudentId(id);
    setStatus("idle");
  }

  async function handleDownload() {
    const id = getStudentId();
    if (!id) return setStatus("no-id");
    setStatus("loading");
    try {
      const payload = await fetchByGakuseki(id);

      // 로컬 저장
      localStorage.setItem(
        LS_KEY_STUDENT(id),
        JSON.stringify(payload.m_students)
      );
      localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(payload.t_events));
      localStorage.setItem(LS_KEY_LAST, JSON.stringify(payload));

      // (선택) SW에 로그 알림
      const msg = { type: "LOG_JSON", payload: { id, ...payload } };
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage(msg);
      } else {
        navigator.serviceWorker?.ready.then((reg) =>
          reg.active?.postMessage(msg)
        );
      }

      setStatus("ok");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Welcome />

      {/* ① 학번 저장 */}
      {!studentId && (
        <div className="space-y-2">
          <div className="font-semibold">学籍番号を入力してください</div>
          <input
            className="border rounded px-2 py-1"
            placeholder='例）"50416"'
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
          />
          <button className="border rounded px-3 py-1" onClick={handleSaveId}>
            保存
          </button>
        </div>
      )}

      {/* ② 서버로 다운로드 */}
      {studentId && (
        <div className="space-y-2">
          <div>
            学籍番号: <b>{studentId}</b>
          </div>
          <button
            className="border rounded px-3 py-1"
            onClick={handleDownload}
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "ダウンロード中…"
              : "サーバーからダウンロード"}
          </button>
        </div>
      )}

      {/* 상태 메시지 */}
      <p className="mt-2">
        {status === "no-id" && "学籍番号が未設定です。入力してください。"}
        {status === "idle" && "準備OK"}
        {status === "loading" && "ダウンロード中…"}
        {status === "ok" && "保存OK（student:master/<id>・events:list/<id>）"}
        {status === "error" && "取得に失敗しました。"}
      </p>
    </div>
  );
}
