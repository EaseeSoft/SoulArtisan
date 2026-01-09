package com.jf.soulartisan.common.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.HashMap;
import java.util.Map;

public class TimeUtil {

    private static final DateTimeFormatter YEAR_FORMATTER = DateTimeFormatter.ofPattern("yyyy");
    private static final DateTimeFormatter QUARTER_FORMATTER = DateTimeFormatter.ofPattern("yyyy-Q");
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final DateTimeFormatter WEEK_FORMATTER = DateTimeFormatter.ofPattern("yyyy-w");
    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 获取指定时间值和日期类型的当前周期和上一个周期的开始和结束时间
     *
     * @param timeValue 时间值，格式如：yyyy, yyyy-qx, yyyy-mm, yyyy-xx
     * @param dateType  日期类型
     * @return Map 包含 currentStart, currentEnd, previousStart, previousEnd 的时间信息
     */
    public static Map<String, LocalDateTime> getTimeRange(String timeValue, DateType dateType) {
        Map<String, LocalDateTime> result = new HashMap<>();

        LocalDateTime[] currentRange = getCurrentTimeRange(timeValue, dateType);
        LocalDateTime[] previousRange = getPreviousTimeRange(timeValue, dateType);

        result.put("currentStart", currentRange[0]);
        result.put("currentEnd", currentRange[1]);
        result.put("previousStart", previousRange[0]);
        result.put("previousEnd", previousRange[1]);

        return result;
    }

    /**
     * 获取当前周期的开始和结束时间
     *
     * @param timeValue 时间值，格式如：yyyy, yyyy-qx, yyyy-mm, yyyy-xx, yyyy-MM-dd
     * @param dateType  日期类型
     * @return [开始时间, 结束时间]
     */
    public static LocalDateTime[] getCurrentTimeRange(String timeValue, DateType dateType) {
        if (dateType == null) {
            throw new IllegalArgumentException("Date type cannot be null");
        }

        switch (dateType) {
            case YEAR:
                return getCurrentYearRange(timeValue);
            case QUARTER:
                return getCurrentQuarterRange(timeValue);
            case MONTH:
                return getCurrentMonthRange(timeValue);
            case WEEK:
                return getCurrentWeekRange(timeValue);
            case DAY:
                return getCurrentDayRange(timeValue);
            default:
                throw new IllegalArgumentException("Unsupported date type: " + dateType);
        }
    }

    /**
     * 获取上一个周期的开始和结束时间
     *
     * @param timeValue 时间值，格式如：yyyy, yyyy-qx, yyyy-mm, yyyy-xx, yyyy-MM-dd
     * @param dateType  日期类型
     * @return [开始时间, 结束时间]
     */
    public static LocalDateTime[] getPreviousTimeRange(String timeValue, DateType dateType) {
        if (dateType == null) {
            throw new IllegalArgumentException("Date type cannot be null");
        }

        switch (dateType) {
            case YEAR:
                return getPreviousYearRange(timeValue);
            case QUARTER:
                return getPreviousQuarterRange(timeValue);
            case MONTH:
                return getPreviousMonthRange(timeValue);
            case WEEK:
                return getPreviousWeekRange(timeValue);
            case DAY:
                return getPreviousDayRange(timeValue);
            default:
                throw new IllegalArgumentException("Unsupported date type: " + dateType);
        }
    }

    // Year methods
    private static LocalDateTime[] getCurrentYearRange(String timeValue) {
        int year = Integer.parseInt(timeValue);
        LocalDateTime start = LocalDateTime.of(year, 1, 1, 0, 0, 0);
        LocalDateTime end = LocalDateTime.of(year, 12, 31, 23, 59, 59);
        return new LocalDateTime[]{start, end};
    }

    private static LocalDateTime[] getPreviousYearRange(String timeValue) {
        int year = Integer.parseInt(timeValue) - 1;
        LocalDateTime start = LocalDateTime.of(year, 1, 1, 0, 0, 0);
        LocalDateTime end = LocalDateTime.of(year, 12, 31, 23, 59, 59);
        return new LocalDateTime[]{start, end};
    }

    // Quarter methods
    private static LocalDateTime[] getCurrentQuarterRange(String timeValue) {
        String[] parts = timeValue.split("-Q|q");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid quarter format. Expected yyyy-Qx, got: " + timeValue);
        }

        int year = Integer.parseInt(parts[0]);
        int quarter = Integer.parseInt(parts[1]);

        if (quarter < 1 || quarter > 4) {
            throw new IllegalArgumentException("Quarter must be between 1 and 4, got: " + quarter);
        }

        int startMonth = (quarter - 1) * 3 + 1; // Q1: Jan(1), Q2: Apr(4), Q3: Jul(7), Q4: Oct(10)
        int endMonth = startMonth + 2;

        LocalDateTime start = LocalDateTime.of(year, startMonth, 1, 0, 0, 0);
        LocalDateTime end = LocalDateTime.of(year, endMonth,
                YearMonth.of(year, endMonth).lengthOfMonth(),
                23, 59, 59);

        return new LocalDateTime[]{start, end};
    }

    private static LocalDateTime[] getPreviousQuarterRange(String timeValue) {
        String[] parts = timeValue.split("-Q|q");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid quarter format. Expected yyyy-Qx, got: " + timeValue);
        }

        int year = Integer.parseInt(parts[0]);
        int quarter = Integer.parseInt(parts[1]);

        if (quarter < 1 || quarter > 4) {
            throw new IllegalArgumentException("Quarter must be between 1 and 4, got: " + quarter);
        }

        int prevQuarter, prevYear;
        if (quarter == 1) {
            prevQuarter = 4;
            prevYear = year - 1;
        } else {
            prevQuarter = quarter - 1;
            prevYear = year;
        }

        int startMonth = (prevQuarter - 1) * 3 + 1;
        int endMonth = startMonth + 2;

        LocalDateTime start = LocalDateTime.of(prevYear, startMonth, 1, 0, 0, 0);
        LocalDateTime end = LocalDateTime.of(prevYear, endMonth,
                YearMonth.of(prevYear, endMonth).lengthOfMonth(),
                23, 59, 59);

        return new LocalDateTime[]{start, end};
    }

    // Month methods
    private static LocalDateTime[] getCurrentMonthRange(String timeValue) {
        String[] parts = timeValue.split("-");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid month format. Expected yyyy-MM, got: " + timeValue);
        }

        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12, got: " + month);
        }

        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0, 0);
        int daysInMonth = YearMonth.of(year, month).lengthOfMonth();
        LocalDateTime end = LocalDateTime.of(year, month, daysInMonth, 23, 59, 59);

        return new LocalDateTime[]{start, end};
    }

    private static LocalDateTime[] getPreviousMonthRange(String timeValue) {
        String[] parts = timeValue.split("-");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid month format. Expected yyyy-MM, got: " + timeValue);
        }

        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12, got: " + month);
        }

        YearMonth current = YearMonth.of(year, month);
        YearMonth previous = current.minusMonths(1);

        LocalDateTime start = LocalDateTime.of(previous.getYear(), previous.getMonthValue(), 1, 0, 0, 0);
        int daysInMonth = previous.lengthOfMonth();
        LocalDateTime end = LocalDateTime.of(previous.getYear(), previous.getMonthValue(), daysInMonth, 23, 59, 59);

        return new LocalDateTime[]{start, end};
    }

    // Week methods
    private static LocalDateTime[] getCurrentWeekRange(String timeValue) {
        String[] parts = timeValue.split("-");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid week format. Expected yyyy-w, got: " + timeValue);
        }

        int year = Integer.parseInt(parts[0]);
        int week = Integer.parseInt(parts[1]);

        // Use ISO week date system
        WeekFields weekFields = WeekFields.ISO;

        // Create a date for the first day of the year
        LocalDate jan1 = LocalDate.of(year, 1, 1);

        // Find the first day of the specified week
        // This approach finds the year-week and gets the Monday of that week
        // Using TemporalAdjusters is the most reliable way to handle ISO weeks
        LocalDate start = jan1.with(weekFields.weekOfYear(), week)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        // Handle edge cases where the calculated date is in the wrong year
        // ISO weeks can span years
        if (start.get(weekFields.weekOfYear()) != week || start.getYear() != year) {
            start = jan1.with(weekFields.weekOfYear(), week)
                    .with(weekFields.weekOfWeekBasedYear(), week)
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        }

        // If the year doesn't match, we need to handle ISO week that crosses year boundary
        if (start.getYear() != year) {
            // Find the Monday of the first week in the specified year
            start = LocalDate.of(year, 1, 1);
            if (start.getDayOfWeek() != DayOfWeek.MONDAY) {
                start = start.with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
            }

            // Advance to the correct week
            start = start.plusWeeks(week - 1);
        }

        LocalDate end = start.plusDays(6); // End of the week is Sunday (6 days after Monday)

        LocalDateTime startDateTime = LocalDateTime.of(start.getYear(), start.getMonthValue(), start.getDayOfMonth(), 0, 0, 0);
        LocalDateTime endDateTime = LocalDateTime.of(end.getYear(), end.getMonthValue(), end.getDayOfMonth(), 23, 59, 59);

        return new LocalDateTime[]{startDateTime, endDateTime};
    }

    private static LocalDateTime[] getPreviousWeekRange(String timeValue) {
        String[] parts = timeValue.split("-");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid week format. Expected yyyy-w, got: " + timeValue);
        }

        int year = Integer.parseInt(parts[0]);
        int week = Integer.parseInt(parts[1]);

        // Calculate previous week
        int prevWeek, prevYear;
        if (week == 1) {
            // Previous week is week 52 or 53 of the previous year
            prevYear = year - 1;
            WeekFields weekFields = WeekFields.ISO;
            // Calculate how many weeks in the previous year
            prevWeek = LocalDate.of(prevYear, 12, 28).get(weekFields.weekOfYear()); // Last week that has most days in the year
        } else {
            prevWeek = week - 1;
            prevYear = year;
        }

        // Use the same calculation as current week but for the previous week
        WeekFields weekFields = WeekFields.ISO;
        LocalDate jan1 = LocalDate.of(prevYear, 1, 1);

        LocalDate start = jan1.with(weekFields.weekOfYear(), prevWeek)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        // Handle edge case for year boundary
        if (start.getYear() != prevYear) {
            start = LocalDate.of(prevYear, 1, 1);
            if (start.getDayOfWeek() != DayOfWeek.MONDAY) {
                start = start.with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
            }
            start = start.plusWeeks(prevWeek - 1);
        }

        LocalDate end = start.plusDays(6);

        LocalDateTime startDateTime = LocalDateTime.of(start.getYear(), start.getMonthValue(), start.getDayOfMonth(), 0, 0, 0);
        LocalDateTime endDateTime = LocalDateTime.of(end.getYear(), end.getMonthValue(), end.getDayOfMonth(), 23, 59, 59);

        return new LocalDateTime[]{startDateTime, endDateTime};
    }

    // Day methods
    private static LocalDateTime[] getCurrentDayRange(String timeValue) {
        LocalDate date = LocalDate.parse(timeValue, DAY_FORMATTER);
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(23, 59, 59);
        return new LocalDateTime[]{start, end};
    }

    private static LocalDateTime[] getPreviousDayRange(String timeValue) {
        LocalDate date = LocalDate.parse(timeValue, DAY_FORMATTER);
        LocalDate previousDate = date.minusDays(1);
        LocalDateTime start = previousDate.atStartOfDay();
        LocalDateTime end = previousDate.atTime(23, 59, 59);
        return new LocalDateTime[]{start, end};
    }

    public enum DateType {
        YEAR, QUARTER, MONTH, WEEK, DAY
    }
}