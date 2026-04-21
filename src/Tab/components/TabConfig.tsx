import React, { useEffect } from "react";
import * as teamsJs from "@microsoft/teams-js";

interface Props {
  contentUrl: string;
}

export default function TabConfig({ contentUrl }: Props) {
  useEffect(() => {
    teamsJs.pages.config.setValidityState(true);
    teamsJs.pages.config.setConfig({
      contentUrl,
      entityId: "vacation-calendar",
      suggestedDisplayName: "팀 휴가 캘린더",
    });
    teamsJs.pages.config.registerOnSaveHandler((saveEvent) => {
      saveEvent.notifySuccess();
    });
  }, [contentUrl]);

  return (
    <div className="tab-config">
      <div className="tab-config-inner">
        <div className="tab-config-icon">📅</div>
        <h1>팀 휴가 캘린더</h1>
        <p>팀원들의 휴가 일정을 한눈에 확인하고 관리합니다.</p>
        <p className="tab-config-hint">아래 <strong>저장</strong> 버튼을 눌러 채널에 추가하세요.</p>
      </div>
    </div>
  );
}
