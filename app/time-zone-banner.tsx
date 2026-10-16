"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../lib/i18n";
import { detectTimeZone, summarizeTimeZoneOffsets } from "../lib/time-zone";
import type { Slot } from "../lib/types";

export function TimeZoneBanner({
  timeZone,
  slots,
  compareDevice = false,
}: {
  timeZone: string | null;
  slots: Slot[];
  compareDevice?: boolean;
}) {
  const { t } = useLanguage();
  const [deviceTimeZone, setDeviceTimeZone] = useState<string | null>(null);
  const offset = useMemo(
    () => (timeZone ? summarizeTimeZoneOffsets(timeZone, slots) : ""),
    [slots, timeZone],
  );

  useEffect(() => {
    if (compareDevice) setDeviceTimeZone(detectTimeZone());
  }, [compareDevice]);

  const differsFromDevice = Boolean(
    compareDevice && timeZone && deviceTimeZone && timeZone !== deviceTimeZone,
  );

  return (
    <div className="time-zone-panel sans" data-different={differsFromDevice}>
      <span className="time-zone-panel__icon" aria-hidden="true">
        <Globe2 size={18} />
      </span>
      <div className="time-zone-panel__body">
        <span className="time-zone-panel__label">{t("pollTimeReference")}</span>
        <strong className="time-zone-panel__value">
          {timeZone ? timeZone : t("timeZoneNotSpecified")}
        </strong>
        {offset ? <span className="time-zone-panel__offset">{offset}</span> : null}
        <p className="time-zone-panel__detail">
          {differsFromDevice
            ? t("deviceTimeZoneDifferent", { timeZone: deviceTimeZone ?? "" })
            : compareDevice && deviceTimeZone
              ? t("deviceTimeZoneSame")
              : t("pollTimeZoneHelp")}
        </p>
        {compareDevice ? (
          <p className="time-zone-panel__privacy">{t("deviceTimeZonePrivacy")}</p>
        ) : null}
      </div>
    </div>
  );
}
