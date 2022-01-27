import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { AccountService } from '../../core/services/account.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'fb-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  @Input() loginPageRedirect: boolean = true;
  @Input() email: string | undefined;

  @Output() loginEvent = new EventEmitter<boolean>();

  unsubscribe$ = new Subject<void>();

  form: FormGroup;
  loginInvalid = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private accountService: AccountService,
  ) {
    this.form = this.fb.group({
      email: [this.email, Validators.email],
      password: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.form.setValue({email: this.email, password: ''})
    if (this.email) {
      this.form.controls["email"].disable();
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  async onSubmit(): Promise<void> {
    this.loginInvalid = false;
    if (this.form.valid) {
      const loginData = {
        email: this.form.get('email')?.value,
        password: this.form.get('password')?.value
      };

      this.accountService.login(loginData).pipe(takeUntil(this.unsubscribe$)).subscribe({
        next: async resp => {
          localStorage.setItem('access_token', resp.access_token);
          localStorage.setItem('refresh_token', resp.refresh_token);
          if (this.loginPageRedirect) {
            this.router.navigate(['']);
          }
          this.loginEvent.emit(true);
        },
        error: async (error: any) => {
          if (error.status === 401) {
            this.loginInvalid = true;
          }
          this.loginEvent.emit(false);
        }
      })
    }
  }
}
