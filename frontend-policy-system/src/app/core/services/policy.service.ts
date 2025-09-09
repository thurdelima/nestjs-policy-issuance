import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PolicyRequest {
  type: 'fianca' | 'capitalizacao';
  customerId: string;
  coverageAmount: number;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  coverageDetails: {
    description: string;
    terms: string[];
    exclusions: string[];
    conditions: string[];
  };
  metadata?: Record<string, any>;
}

export interface PolicyResponse {
  id: string;
  policyNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  customerPhone: string;
  customerAddress: string;
  type: string;
  coverageAmount: number;
  premiumAmount: number;
  effectiveDate: string;
  endDate: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private readonly API_URL = environment.apiUrlPolicy;

  constructor(private http: HttpClient) { }

  createPolicy(policyData: PolicyRequest): Observable<PolicyResponse> {
    return this.http.post<PolicyResponse>(`${this.API_URL}/policies`, policyData);
  }
}
