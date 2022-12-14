import React, { lazy, Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux"; // 2

import { changeActive, PERIOD, START_TIMER, STOP_TIMER } from "../../actions/timer";

import { pushNotification } from "../../utils/helper";
import audioPlayer from "../../utils/audioPlayer";

import Loading from "../../utils/Loading";

import "./style.css";

const AnalogTimer = lazy(() => import("./Analog/Analog"));
const DigitalTimer = lazy(() => import("./Digital/Digital"));

const worker = new window.Worker('worker.js');
const Timer = () => {
    const { active, activites, setting, started, periodNum } = useSelector((state) => state.timer);
    const { activeId } = useSelector(state => state.tasks);
    const [time, setTime] = useState(localStorage.getItem("restOfTime") === null ? 0 : Number(localStorage.getItem("restOfTime")));

    const activePeriod = setting?.time[active];
    const dispatch = useDispatch();

    /** All sounds that we use it in timer.*/
    const tickingSound = useRef(setting?.tickingType?.name !== "none" ?
        audioPlayer({
            src: setting?.tickingType?.src,
            volume: setting?.tickingVolume,
            loop: true
        }) :
        null
    );

    const alarmSound = useRef(
        audioPlayer({
            src: setting?.alarmType?.src,
            volume: setting?.alarmVolume,
            loop: setting?.alarmRepet
        })
    );

    const clickSound = useRef(setting?.clickType?.name !== "none" ?
        audioPlayer({
            src: setting?.clickType?.src,
            volume: setting?.clickVolume
        }) : null
    );

    useEffect(() => {
        // eslint-disable-next-line
        if (typeof window?.Notification != undefined) {
            if (window?.Notification?.permission === 'default') {
                window?.Notification?.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        document.body.style.backgroundColor = activites[active].color;

        if (setting.time !== undefined) {
            if (setting?.time[active] - Number(localStorage.getItem('restOfTime')) > 1) {
                setTime(setting?.time[active] - Number(localStorage.getItem("restOfTime")));
            } else {
                dispatch(changeActive(active, activeId));
                localStorage.setItem('restOfTime', 0);
            }
        }
        // eslint-disable-next-line
    }, [active, setting.time]);

    useEffect(() => {
        if (setting?.tickingType.name !== 'none') {
            tickingSound.current.chengeVolume(setting?.tickingVolume);
            tickingSound.current.changeFile(setting?.tickingType.src);
        }

        alarmSound.current.chengeVolume(setting?.alarmVolume);
        alarmSound.current.changeFile(setting?.alarmType.src);
        alarmSound.current.changeLoop(setting?.alarmRepet);

        if (setting.clickType.name !== 'none') {
            clickSound.current.chengeVolume(setting.clickVolume);
            clickSound.current.changeFile(setting.clickType.src);
        }
    }, [setting]);

    useEffect(() => {
        if (((active === PERIOD && setting.autoPomodors) || (active !== PERIOD && setting.autoBreaks)) && periodNum !== 0 && started) {
            setTimeout(() => {
                alarmSound.current.handleStop();
                if (setting.tickingType.name !== "none") {
                    tickingSound.current.handlePlay();
                }
                worker.postMessage({ started: !started, count: setting.time[active] });
                dispatch({ type: START_TIMER, data: 0 });
                console.log(time, 0, "autoBreaks autoPomodors");
            }, 1000)
            console.log(active);
        }
        // eslint-disable-next-line
    }, [active, setting.autoBreaks, setting.autoPomodors]);

    useEffect(() => {
        if (started) {
            document.body.onbeforeunload = () => {
                return () => {
                    return "Hello, world!"
                }
            }

            if (setting.focusMode) {
                document.body.style.backgroundColor = "rgb(30 30 30)";
                document.body.style.overflow = "hidden";
            }
        } else {
            document.body.onbeforeunload = null;
            if (setting.focusMode) {
                document.body.style.backgroundColor = activites[active].color;
                document.body.style.overflow = "auto";
            }
        }
        // eslint-disable-next-line
    }, [started]);

    worker.onmessage = (event) => {
        if (event.data !== 'stop') {
            setTime(event.data);
            // eslint-disable-next-line
            if (typeof window?.Notification != undefined) {
                if (window?.Notification?.permission === 'granted') {
                    if (time !== 0) {
                        if (setting.notificationType === 'every') {
                            if (time % (setting.notificationInterval * 60) === 0 && time !== activePeriod) {
                                pushNotification(`${time / 60} minutes left!`);
                            }
                        } else {
                            if (time - (setting.notificationInterval * 60) === 0 && time !== activePeriod) {
                                pushNotification(`${time / 60} minutes left!`);
                            }
                        }
                    }
                }
            }
        } else {
            console.log(event.data, time, 0, "worker stop");

            alarmSound.current.handlePlay();
            if (setting.tickingType.name !== "none") {
                tickingSound.current.handleStop();
            }

            // eslint-disable-next-line
            if (typeof window?.Notification != undefined) {
                if (window?.Notification.permission === 'granted') {
                    if (active === PERIOD) {
                        pushNotification("It's time to take a break");
                    } else {
                        pushNotification("It's time to focus!");
                    }
                }
            }

            if (((active !== PERIOD && !setting.autoPomodors) || (active === PERIOD && !setting.autoBreaks))) {
                dispatch({ type: STOP_TIMER, data: 0 });
            }

            dispatch(changeActive(active, activeId));
        }
    }

    const toggleStart = useCallback(() => {
        console.log("toggle start")
        if (setting.clickType.name !== "none") {
            clickSound.current.handlePlay();
        }
        alarmSound.current.handleStop();

        if (started) {
            worker.postMessage("stop");
            if (setting.tickingType.name !== "none") {
                tickingSound.current.handleStop();
            }
            dispatch({ type: STOP_TIMER, data: setting.time[active] - time });
        } else {
            if (setting.tickingType.name !== "none") {
                tickingSound.current.handlePlay();
            }
            if (!started) {
                worker.postMessage({ started: !started, count: time });
            }
            dispatch({ type: START_TIMER, data: 0 });
        }

        // eslint-disable-next-line
    }, [started, time]);

    const handleReset = () => {
        setTime(activePeriod);
        if (setting.clickType.name !== "none") {
            clickSound.current.handlePlay();
        }
        localStorage.setItem("restOfTime", 0)
    }

    return (
        <>
            <div className="clock-container" style={{ background: activites[active].timerBorder }}>
                <div className="clock">
                    <Suspense fallback={<Loading color={activites[active].color} backgroud="transparent" size="200" strokeWidth="2.5" />}>
                        {setting.format === "digital" ? (
                            <>
                                <DigitalTimer handleReset={handleReset} toggleStart={toggleStart} setTime={setTime} time={time} />
                            </>
                        ) : (
                            <>
                                <AnalogTimer handleReset={handleReset} toggleStart={toggleStart} setTime={setTime} time={time} />
                            </>
                        )}
                    </Suspense>
                </div>
            </div>
        </>
    )
}

export default Timer;