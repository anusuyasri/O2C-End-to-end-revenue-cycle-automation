from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SAP O2C Credit Management API", version="1.0.0")


class Customer(BaseModel):
    id: str
    name: str
    creditLimit: float
    receivables: float
    invoices: float
    currency: str = "USD"
    validFrom: str
    validTo: str
    status: str = "ok"


class CreditHistory(BaseModel):
    id: int
    customerId: str
    type: str
    oldLimit: Optional[float] = None
    newLimit: Optional[float] = None
    oldStatus: Optional[str] = None
    newStatus: Optional[str] = None
    date: str
    user: str
    notes: str


class CreditLimitUpdate(BaseModel):
    creditLimit: float
    validTo: str
    notes: str


MOCK_CUSTOMERS = [
    Customer(id="CUST001", name="Acme Corporation", creditLimit=50000, receivables=12000, invoices=8000, currency="USD", validFrom="2026-01-01", validTo="2026-12-31", status="ok"),
    Customer(id="CUST002", name="Global Tech Industries", creditLimit=75000, receivables=65000, invoices=15000, currency="USD", validFrom="2026-01-01", validTo="2026-12-31", status="blocked"),
    Customer(id="CUST003", name="Premier Solutions Ltd", creditLimit=25000, receivables=8000, invoices=5000, currency="USD", validFrom="2026-01-15", validTo="2026-12-31", status="ok"),
    Customer(id="CUST004", name="Stellar Enterprises", creditLimit=100000, receivables=45000, invoices=20000, currency="USD", validFrom="2026-01-01", validTo="2027-01-01", status="ok"),
    Customer(id="CUST005", name="Apex Manufacturing", creditLimit=30000, receivables=28000, invoices=12000, currency="USD", validFrom="2026-02-01", validTo="2026-12-31", status="warning"),
    Customer(id="CUST006", name="Oceanic Trading Co", creditLimit=60000, receivables=35000, invoices=18000, currency="USD", validFrom="2026-01-01", validTo="2026-12-31", status="ok"),
    Customer(id="CUST007", name="Visionary Systems", creditLimit=40000, receivables=42000, invoices=10000, currency="USD", validFrom="2026-01-01", validTo="2026-12-31", status="warning"),
    Customer(id="CUST008", name="Quantum Dynamics", creditLimit=80000, receivables=22000, invoices=15000, currency="USD", validFrom="2026-01-15", validTo="2027-01-15", status="ok"),
    Customer(id="CUST009", name="Horizon Group", creditLimit=55000, receivables=15000, invoices=8000, currency="USD", validFrom="2026-01-01", validTo="2026-12-31", status="ok"),
    Customer(id="CUST010", name="Atlas Industries", creditLimit=90000, receivables=85000, invoices=25000, currency="USD", validFrom="2026-01-01", validTo="2026-12-31", status="blocked"),
]

MOCK_HISTORY = [
    CreditHistory(id=1, customerId="CUST001", type="limit_increase", oldLimit=30000, newLimit=50000, date="2026-01-15", user="Admin", notes="Increased based on payment history"),
    CreditHistory(id=2, customerId="CUST002", type="status_change", oldStatus="warning", newStatus="blocked", date="2026-02-01", user="System", notes="Credit limit exceeded"),
    CreditHistory(id=3, customerId="CUST004", type="limit_increase", oldLimit=75000, newLimit=100000, date="2026-03-01", user="Admin", notes="Annual review adjustment"),
    CreditHistory(id=4, customerId="CUST005", type="status_change", oldStatus="ok", newStatus="warning", date="2026-03-10", user="System", notes="Approaching credit limit"),
    CreditHistory(id=5, customerId="CUST006", type="limit_increase", oldLimit=40000, newLimit=60000, date="2026-03-15", user="Admin", notes="Business expansion"),
]

customers_db: List[Customer] = MOCK_CUSTOMERS
history_db: List[CreditHistory] = MOCK_HISTORY
next_history_id = 6


def calculate_credit_status(customer: Customer) -> str:
    """Calculate credit status based on usage percentage."""
    used = customer.receivables + customer.invoices
    available = customer.creditLimit - used
    percentage = (used / customer.creditLimit) * 100 if customer.creditLimit > 0 else 0
    
    if available < 0 or percentage > 100:
        return "blocked"
    elif percentage >= 80:
        return "warning"
    return "ok"


@app.get("/")
async def root():
    return {"message": "SAP O2C Credit Management API", "version": "1.0.0"}


@app.get("/api/customers", response_model=List[Customer])
async def get_customers():
    return customers_db


@app.get("/api/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    for customer in customers_db:
        if customer.id == customer_id:
            return customer
    raise HTTPException(status_code=404, detail="Customer not found")


@app.put("/api/customers/{customer_id}/credit-limit")
async def update_credit_limit(customer_id: str, update: CreditLimitUpdate):
    global next_history_id
    
    for customer in customers_db:
        if customer.id == customer_id:
            old_limit = customer.creditLimit
            
            if update.creditLimit > 1_000_000_000:
                raise HTTPException(status_code=400, detail="Credit limit exceeds maximum")
            
            customer.creditLimit = update.creditLimit
            customer.validTo = update.validTo
            
            new_history = CreditHistory(
                id=next_history_id,
                customerId=customer_id,
                type="limit_increase",
                oldLimit=old_limit,
                newLimit=update.creditLimit,
                date=datetime.now().strftime("%Y-%m-%d"),
                user="Credit Manager",
                notes=update.notes
            )
            history_db.insert(0, new_history)
            next_history_id += 1
            
            return customer
    
    raise HTTPException(status_code=404, detail="Customer not found")


@app.get("/api/history", response_model=List[CreditHistory])
async def get_history():
    return history_db


@app.get("/api/dashboard")
async def get_dashboard():
    total_ok = 0
    total_warning = 0
    total_blocked = 0
    total_used = 0
    total_limit = 0
    
    for customer in customers_db:
        status = calculate_credit_status(customer)
        used = customer.receivables + customer.invoices
        total_used += used
        total_limit += customer.creditLimit
        
        if status == "ok":
            total_ok += 1
        elif status == "warning":
            total_warning += 1
        else:
            total_blocked += 1
    
    exposure_percent = round((total_used / total_limit) * 100) if total_limit > 0 else 0
    
    return {
        "totalCustomers": len(customers_db),
        "creditOk": total_ok,
        "approachingLimit": total_warning,
        "creditBlocked": total_blocked,
        "totalUsed": total_used,
        "totalLimit": total_limit,
        "exposurePercent": exposure_percent
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)