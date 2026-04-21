import React from "react";
import * as teamsJs from "@microsoft/teams-js";
import { UserInfo } from "./types";
import VacationCalendar from "./components/VacationCalendar";
import TabConfig from "./components/TabConfig";
import "./App.css";

const MOCK_USER: UserInfo = {
  userId: "dev-user-local",
  userDisplayName: "개발자 (로컬)",
};

type AppMode = "calendar" | "config" | "loading";

export default function App() {
  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [mode, setMode] = React.useState<AppMode>("loading");

  React.useEffect(() => {
    teamsJs.app
      .initialize()
      .then(() => teamsJs.app.getContext())
      .then((context) => {
        const isConfig = context.page?.frameContext === teamsJs.FrameContexts.settings;
        setMode(isConfig ? "config" : "calendar");
        if (!isConfig) {
          setUser({
            userId: context.user?.id ?? "unknown",
            userDisplayName: context.user?.displayName ?? "알 수 없는 사용자",
          });
        }
      })
      .catch(() => {
        // Not running inside Teams — use mock user for local dev
        setUser(MOCK_USER);
        setMode("calendar");
      });
  }, []);

  if (mode === "loading") return <div className="app-loading">초기화 중...</div>;

  if (mode === "config") {
    const contentUrl = `${window.location.origin}/tabs/home`;
    return <TabConfig contentUrl={contentUrl} />;
  }

  if (!user) return <div className="app-loading">초기화 중...</div>;

  return (
    <div className="App">
      <header className="app-header">
        <span className="app-title">팀 휴가 캘린더</span>
        <span className="app-user">{user.userDisplayName}</span>
      </header>
      <main className="app-main">
        <VacationCalendar currentUser={user} />
      </main>
    </div>
  );
}
