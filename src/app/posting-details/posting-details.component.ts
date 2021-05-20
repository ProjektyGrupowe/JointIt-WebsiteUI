import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Posting } from '../common/posting';
import { PostingService } from '../service/posting.service';
import { MailService } from '../service/mail.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-posting-details',
  templateUrl: './posting-details.component.html',
  styleUrls: ['./posting-details.component.css']
})
export class PostingDetailsComponent implements OnInit {
  posting: Posting = new Posting();
  applyForm: FormGroup;
  fileToUpload: File;
  loading = false;
  submitted = false;



  constructor(private postingService: PostingService,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private mailService: MailService,
    private toastr: ToastrService,
    private router: Router) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.getValues();
    });

    this.applyForm = this.formBuilder.group({
      firstAndLastName: ['', Validators.required],
      email: ['', Validators.required],
      introduction: ['', Validators.required],
      pdfFile: ['', Validators.required]
    });
  }

  getValues() {
    this.spinner.show();
    const id: number = +this.route.snapshot.paramMap.get('id');
    this.postingService.get(id).subscribe(this.processResultForPostings());
  }

  processResultForPostings() {
    this.spinner.show();
    const id: number = +this.route.snapshot.paramMap.get('id');

    return data => {
      this.posting = data;
      this.postingService.getCategory(id).subscribe(
        data => {
          this.posting.postingCategory = data.categoryName;

        }
      )

      this.spinner.hide();
      console.log(this.posting)
      setTimeout(() => {
        /** spinner ends after 2 seconds */
        this.spinner.hide();
      }, 2000);
    }
  }


  get f() { return this.applyForm.controls; }


  public onFileChanged(event) {
    this.fileToUpload = event.target.files[0];
  }

  sendEmail() {
    this.spinner.show();
    this.submitted = true;

    const formData: FormData = new FormData();
    formData.append('pdfFile', this.fileToUpload, this.fileToUpload.name);
    this.f.pdfFile.setValue(this.fileToUpload);

    if (this.applyForm.invalid) {
      this.toastr.warning('Form is invalid!');
      this.spinner.hide();
    }
    else {
      this.loading = true;
      this.mailService.sendEmail(formData, this.posting.email, this.f.email.value, this.f.firstAndLastName.value, this.f.introduction.value, this.posting.companyName,
        this.posting.localization, this.posting.positionName)
        .pipe(first())
        .subscribe(
          data => {
            this.toastr.success('Success!');
            this.spinner.hide();
            setTimeout(() => {
              this.router.navigate(['/board']);
            }, 1000)
          },
          error => {
            this.toastr.error(error);
            this.spinner.hide();
          });
    }
  }
}
