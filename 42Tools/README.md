

```sql
SELECT 
    userId,
    DATE(beginAt / 1000, 'unixepoch') AS connection_date,
    SUM(
        CASE 
            WHEN DATE(beginAt / 1000, 'unixepoch') = DATE(endAt / 1000, 'unixepoch') THEN strftime('%s', endAt / 1000, 'unixepoch') - strftime('%s', beginAt / 1000, 'unixepoch')
            ELSE 
                strftime('%s', DATE(beginAt / 1000, 'unixepoch', '+1 day')) - strftime('%s', beginAt / 1000, 'unixepoch')  +
                strftime('%s', endAt / 1000, 'unixepoch') - strftime('%s', DATE(endAt / 1000, 'unixepoch', 'start of day'))
        END
    ) AS total_connection_time_seconds
FROM 
    user_location
GROUP BY 
    userId, DATE(beginAt / 1000, 'unixepoch')
ORDER BY 
    userId, DATE(beginAt / 1000, 'unixepoch');

```


```sql
            SELECT 
                u.campusId,
                strftime('%Y', datetime(beginAt / 1000, 'unixepoch')) AS year,
                SUM(
                    CASE 
                        WHEN strftime('%Y', datetime(beginAt / 1000, 'unixepoch')) = strftime('%Y', datetime(endAt / 1000, 'unixepoch')) THEN endAt - beginAt
                        ELSE 
                            strftime('%s', datetime(beginAt / 1000, 'unixepoch', '+1 month')) - beginAt +
                            endAt - strftime('%s', datetime(endAt / 1000, 'unixepoch', 'start of month'))
                    END
                ) / 3600 AS logtime_hours
            FROM 
                user_location AS ul
            JOIN users AS u on ul.userId = u.id
            WHERE
                ul.userId IS NOT NULL 
                AND u.campusId IS NOT NULL
                AND ul.endAt > ul.beginAt
                AND (ul.endAt / 1000 - ul.beginAt / 1000) <= 24 * 3600
                AND u.isStaff = false
            GROUP BY 
                u.campusId, strftime('%Y', datetime(beginAt / 1000, 'unixepoch'))
            ORDER BY 
                u.campusId, strftime('%Y', datetime(beginAt / 1000, 'unixepoch'));
```