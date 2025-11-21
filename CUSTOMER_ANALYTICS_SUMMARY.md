# Customer Analytics Feature

## Overview
The customer analytics feature provides insights into customer behavior and engagement patterns. This feature is accessible only to administrators and helps in understanding customer trends, identifying top customers, and analyzing booking frequencies.

## Features Implemented

### 1. Customer Statistics
- **Total Customers**: Overall count of registered customers
- **Active Customers**: Customers who have made bookings within the last 30 days
- **Inactive Customers**: Customers who haven't made bookings in the last 30 days

### 2. Booking Frequency Analysis
Categorizes customers based on their booking frequency:
- 1 booking
- 2-5 bookings
- 6-10 bookings
- 10+ bookings

### 3. Top Customers
Identifies the top 10 customers based on total spending, showing:
- Customer name
- Email address
- Total booking count
- Total amount spent

### 4. Date Filtering
Allows administrators to filter analytics data by date range:
- Start date
- End date

## API Endpoint
```
GET /api/reports/customer-analytics
```

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | Date | Filter data from this date (YYYY-MM-DD) |
| endDate | Date | Filter data up to this date (YYYY-MM-DD) |

### Response Format
```json
{
  "reportType": "customerAnalytics",
  "generatedAt": "2025-11-20T03:25:14.311Z",
  "filters": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-20"
  },
  "analytics": {
    "totalCustomers": 150,
    "activeCustomers": 85,
    "inactiveCustomers": 65,
    "bookingFrequency": {
      "1": 45,
      "2-5": 30,
      "6-10": 10,
      "10+": 5
    },
    "topCustomers": [
      {
        "customerId": "CUS001",
        "bookingCount": 15,
        "totalSpent": 45000.00,
        "name": "John Doe",
        "email": "john@example.com"
      }
    ]
  }
}
```

## Frontend Implementation
The customer analytics feature is integrated into the reports section of the admin dashboard with:
- Dedicated tab for customer analytics
- Date filtering options
- Visual representation of key metrics
- Tabular display of top customers
- Booking frequency distribution charts

## Access Control
Only administrators have access to customer analytics reports, ensuring data privacy and security.

## Future Enhancements
Potential improvements for future versions:
1. Geographic distribution of customers
2. Customer lifetime value calculations
3. Cohort analysis
4. Customer segmentation based on booking patterns
5. Integration with marketing campaigns