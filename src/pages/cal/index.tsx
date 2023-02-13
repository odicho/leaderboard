import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useEffect, useRef, useState } from "react";
dayjs.extend(utc);
dayjs.extend(timezone);

export default function Calendar({
	selectedDate,
	setSelectedDate,
	onClose,
}: {
	selectedDate: string;
	setSelectedDate: (currentDay: string) => void;
	onClose: () => void;
}) {
	const localTimezone = "America/Los_Angeles";
	const today = dayjs().tz(localTimezone);

	return (
		<MonthBlock
			today={today}
			selectedDate={selectedDate}
			setSelectedDate={setSelectedDate}
			onClose={onClose}
		/>
	);
}

type MonthSlots = {
	[key: string]: { startTime: string; endTime: string }[];
};

const MonthBlock = ({
	today,
	selectedDate,
	setSelectedDate,
	onClose,
}: {
	today: Dayjs;
	selectedDate: string;
	setSelectedDate: (currentDay: string) => void;
	onClose: () => void;
}) => {
	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose]);

	// TODO: Move this to server side so that it doesn't get triggered on every re-render
	const firstDayofMonth = today.startOf("month");
	const currentDay = today.format("YYYY-MM-DD");

	const [currentMonth, setCurrentMonth] = useState(firstDayofMonth);
	const daysInMonth = currentMonth.daysInMonth();
	const firstDay = currentMonth.startOf("month").get("day");

	const daysBefore = firstDay;
	const handleNextMonth = () => {
		setCurrentMonth((curr) => curr.add(1, "month"));
	};

	const handlePreviousMonth = () => {
		if (currentMonth.subtract(1, "month").isBefore("2023-01-01")) {
			return;
		}
		setCurrentMonth((curr) => curr.subtract(1, "month"));
	};

	const blocks: MonthSlots = {};

	for (let i = 0; i < daysInMonth; i++) {
		const currentDate = currentMonth.add(i, "day");
		blocks[dayjs(currentDate).format("YYYY-MM-DD")] = [];
	}

	const handleSetSelectedDate = (currentDay: string) => {
		setSelectedDate(currentDay);
		onClose();
	};

	const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const entries = Object.entries(blocks);

	return (
		<div className="absolute z-10 pt-12 sm:right-0">
			<div
				ref={modalRef}
				className=" min-w-[400px] max-w-[50rem] rounded-md border bg-[#FFFFFF] p-2 shadow-md"
			>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between gap-3">
						<p className="pl-1">{currentMonth.format("MMMM YYYY")}</p>
						<div className="flex gap-2 font-bold">
							<button
								disabled={currentMonth.isSame("2023-01-01", "month")}
								className={`${
									currentMonth.isSame("2023-01-01", "month")
										? "text-[#111111]/40"
										: ""
								} px-3 py-1`}
								onClick={handlePreviousMonth}
							>
								{"<"}
							</button>
							<button
								disabled={currentMonth.isSame(currentDay, "month")}
								className={`${
									currentMonth.isSame(currentDay, "month")
										? "text-[#111111]/40"
										: ""
								} px-3 py-1`}
								onClick={handleNextMonth}
							>
								{">"}
							</button>
						</div>
					</div>
					<div className="grid grid-cols-7 gap-0.5 text-center">
						<>
							{daysOfWeek.map((day, index) => {
								return (
									<div
										key={index}
										className="flex aspect-square items-center justify-center"
									>
										<p>{day}</p>
									</div>
								);
							})}
							{[...Array(daysBefore)].map((_, index) => {
								return (
									<div
										key={index}
										className="flex aspect-square items-center justify-center"
									>
										<button
											disabled={true}
											className={"h-full w-full bg-inherit"}
										></button>
									</div>
								);
							})}
							{entries.map(([day], index) => {
								return (
									// TODO: change key here from index -> day
									<div
										key={index}
										className="flex aspect-square items-center justify-center"
									>
										<button
											className={
												"h-full w-full rounded-md bg-gray-100 " +
												(day === currentDay && selectedDate !== day
													? "text-blue-500 "
													: " ") +
												(selectedDate === day
													? " bg-[#111111] text-white "
													: " hover:bg-gray-300 ")
											}
											onClick={() => handleSetSelectedDate(day)}
										>
											{day ? dayjs(day).format("D") : ""}
										</button>
									</div>
								);
							})}
						</>
					</div>
				</div>
			</div>
		</div>
	);
};
