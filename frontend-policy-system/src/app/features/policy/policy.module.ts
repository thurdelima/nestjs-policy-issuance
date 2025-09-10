import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

import { SharedModule } from '../../shared/shared.module';
import { PolicyCreateComponent } from './components/policy-create.component';

const routes = [
  {
    path: 'create',
    component: PolicyCreateComponent
  }
];

@NgModule({
  declarations: [
    PolicyCreateComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes),
    NgxMaskDirective,
    NgxMaskPipe
  ],
  providers: [
    provideNgxMask()
  ]
})
export class PolicyModule { }
