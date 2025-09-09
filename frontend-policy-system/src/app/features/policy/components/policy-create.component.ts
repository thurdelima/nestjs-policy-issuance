import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PolicyService, PolicyRequest } from '../../../core/services/policy.service';

@Component({
  selector: 'app-policy-create',
  standalone: false,
  templateUrl: './policy-create.component.html',
  styleUrls: ['./policy-create.component.css']
})
export class PolicyCreateComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  policyForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private policyService: PolicyService,
    private snackBar: MatSnackBar
  ) {
    // Criar FormArrays primeiro
    const termsArray = this.fb.array([
      this.fb.control('Cobertura por 12 meses'),
      this.fb.control('Franquia de R$ 500,00')
    ]);

    const exclusionsArray = this.fb.array([
      this.fb.control('Danos causados por terceiros'),
      this.fb.control('Desgaste natural')
    ]);

    const conditionsArray = this.fb.array([
      this.fb.control('Pagamento em dia'),
      this.fb.control('Comunicação de sinistros em até 48h')
    ]);

    this.policyForm = this.fb.group({
      type: ['', [Validators.required]],
      customerId: [this.generateUUID()], // UUID válido
      coverageAmount: [0, [Validators.required, Validators.min(1)]],
      premiumAmount: [0, [Validators.required, Validators.min(1)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      coverageDetails: this.fb.group({
        description: ['', [Validators.required]],
        terms: termsArray,
        exclusions: exclusionsArray,
        conditions: conditionsArray
      }),
      metadata: this.fb.group({})
    });
  }

  ngOnInit(): void {
    // Definir datas padrão
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    this.policyForm.patchValue({
      startDate: today,
      endDate: nextYear
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private initializeFormArrays(): void {
    const termsArray = this.getTermsArray();
    const exclusionsArray = this.getExclusionsArray();
    const conditionsArray = this.getConditionsArray();

    // Limpar e re-adicionar valores padrão
    termsArray.clear();
    termsArray.push(this.fb.control('Cobertura por 12 meses'));
    termsArray.push(this.fb.control('Franquia de R$ 500,00'));

    exclusionsArray.clear();
    exclusionsArray.push(this.fb.control('Danos causados por terceiros'));
    exclusionsArray.push(this.fb.control('Desgaste natural'));

    conditionsArray.clear();
    conditionsArray.push(this.fb.control('Pagamento em dia'));
    conditionsArray.push(this.fb.control('Comunicação de sinistros em até 48h'));
  }


  getTermsArray(): FormArray {
    const terms = this.policyForm.get('coverageDetails.terms') as FormArray;
    if (!terms) {
      console.error('Terms FormArray not found');
    }
    return terms;
  }

  getExclusionsArray(): FormArray {
    const exclusions = this.policyForm.get('coverageDetails.exclusions') as FormArray;
    if (!exclusions) {
      console.error('Exclusions FormArray not found');
    }
    return exclusions;
  }

  getConditionsArray(): FormArray {
    const conditions = this.policyForm.get('coverageDetails.conditions') as FormArray;
    if (!conditions) {
      console.error('Conditions FormArray not found');
    }
    return conditions;
  }

  onSubmit(): void {
    if (this.policyForm.valid) {
      this.isLoading = true;
      const formValue = this.policyForm.value;

      // Converter datas para string ISO e preparar dados
      const policyData: PolicyRequest = {
        type: formValue.type,
        customerId: formValue.customerId,
        coverageAmount: formValue.coverageAmount,
        premiumAmount: formValue.premiumAmount,
        startDate: formValue.startDate.toISOString().split('T')[0],
        endDate: formValue.endDate.toISOString().split('T')[0],
        coverageDetails: {
          description: formValue.coverageDetails.description,
          terms: formValue.coverageDetails.terms,
          exclusions: formValue.coverageDetails.exclusions,
          conditions: formValue.coverageDetails.conditions
        },
        metadata: formValue.metadata || {}
      };

      this.policyService.createPolicy(policyData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open(`Apólice criada com sucesso! Número: ${response.policyNumber}`, 'Fechar', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.policyForm.reset();
          this.stepper.reset(); // Volta para o passo 1
          // Re-inicializar FormArrays com valores padrão
          this.initializeFormArrays();
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Erro ao criar apólice. Tente novamente.', 'Fechar', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          console.error('Policy creation error:', error);
        }
      });
    }
  }
}
