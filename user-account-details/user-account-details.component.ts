  import { Component, EventEmitter, HostListener, OnInit, ViewChild, ElementRef } from "@angular/core";
  import { AdminService } from "../../../modules/admin-module/admin.service";
  import { ActivatedRoute, Router } from "@angular/router";
  import {
    RegistrationModel, RegistrationReviewModel,
    RegistrationTajModel,
    UserStatus,
  } from "../../models/registration.model";
  import Swal from "sweetalert2";
  import { NavigationComponentType } from "../../service/tree.service";
  import { ParamService } from "../../service/param.service";
  import {
    NavigationItem,
    NavigationService,
  } from "../../service/navigation.service";
  import { DialogMessageModel } from "../../models/dialog-message.model";
  import { DatePipe } from "@angular/common";
  import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidatorFn,
    Validators,
  } from "@angular/forms";
  import { AuthenticationService } from "src/app/core/auth/services/authentication.service";
  import {
    BsDatepickerConfig,
    BsDatepickerViewMode,
  } from "ngx-bootstrap/datepicker";
  import {
    DataRequest,
    DataServiceError,
  } from "../../../core/helpers/http/HttpModel";
  import { HttpUtils } from "../../../core/helpers/http/HttpUtils";
  import { AttachmentService } from "../attachment-form/attachment.service";
  import { NgxDropzoneComponent } from "ngx-dropzone";
  import { UserManagementService } from "src/app/modules/user-management-module/user-management.service";
  import { resetPasswordModel } from '../../models/resetPassword.model'
  import { NgxImageCompressService } from '../../../modules/image-compression/ngx-image-compress.service';



  @Component({
    selector: "app-user-account-details",
    templateUrl: "./user-account-details.component.html",
    styleUrls: ["./user-account-details.component.css"],
  })
  export class UserAccountDetailsComponent implements OnInit {
    public static defineNavigation() {
      return {
        id: "User Account Details",
        component: UserAccountDetailsComponent,
        tabTitle: "User Details",
        windowTitle: "Single Window",
        singleton: true,
        accessors: ["Admin.user"],
        params: null,
      };
    }
    constructor(
      private adminService: AdminService,
      private route: ActivatedRoute,
      private router: Router,
      private urlData: ParamService,
      private nav: NavigationService,
      public datepipe: DatePipe,
      private fb: FormBuilder,
      private rs: AuthenticationService,
      private http: HttpUtils,
      private datePipe: DatePipe,
      private userService: UserManagementService,
      private imageCompress: NgxImageCompressService,
      private elementRef: ElementRef
    ) { this.resetPasswordModel = new resetPasswordModel; }

    @ViewChild(NgxDropzoneComponent) dropzone: NgxDropzoneComponent;

    userDetailsForm = new FormGroup({
      firstName: new FormControl(
        { value: "", disabled: false },
        Validators.compose([Validators.required, Validators.pattern("[^0-9]*")])
      ),
      middleName: new FormControl( { value: "", disabled: false }, Validators.compose([Validators.pattern("[^0-9]*")]))
      ,  
      lastName: new FormControl(
        { value: "", disabled: false },
        Validators.compose([Validators.required, Validators.pattern("[^0-9]*")])
      ),
      trn: new FormControl(
        { value: "", disabled: true },
        Validators.compose([
          Validators.required,
          Validators.minLength(13),
          Validators.maxLength(13),
        ])
      ),
      dob: new FormControl(
        { value: "", disabled: true },
        Validators.compose([Validators.required, this.dobNotGreaterThan18()])
      ),
      email: new FormControl(
        { value: "", disabled: false },
        Validators.compose([
          Validators.required,
          Validators.pattern(
            '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
          ),
        ])
      ),
      confirmEmail: new FormControl(
        { value: "", disabled: false },
        Validators.compose([
          Validators.required,
          Validators.pattern(
            '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
          ),
        ])
      ),
      street: new FormControl(
        { value: "", disabled: false },
        Validators.compose([Validators.required, this.capitalizeValidator])
      ),
      town: new FormControl(""),
      parish: new FormControl(
        { value: "", disabled: false },
        Validators.required
      ),
      country: new FormControl(
        { value: "", disabled: false },
        Validators.required
      ),
      idType: new FormControl(
        { value: "", disabled: false },
        Validators.required
      ),
      idNumber: new FormControl(
        { value: "", disabled: false },
        Validators.required
      ),
      idPicture: new FormControl(""),
      issueDate: new FormControl(
        { value: "", disabled: false },
        Validators.compose([
          Validators.required,
          this.dateNotGreaterThanTomorrow(),
        ])
      ),
      expiryDate: new FormControl(
        { value: "", disabled: false },
        Validators.compose([Validators.required, this.expiryDateValidator()])
      ),
      telephoneType1: new FormControl(
        { value: "", disabled: false },
        Validators.compose([Validators.required])
      ),
      telephoneType2: new FormControl(""),
      telephoneType3: new FormControl(""),
      telephone1: new FormControl(
        { value: "", disabled: false },
        Validators.compose([Validators.required, Validators.maxLength(15), Validators.minLength(10, ),Validators.pattern("^[0-9]*$"),])),
      telephone2: new FormControl(
        { value: "", disabled: false }, Validators.compose([Validators.maxLength(15), Validators.minLength(10), Validators.pattern("^[0-9]*$"),])),
      telephone3: new FormControl(
        { value: "", disabled: false }, Validators.compose([Validators.maxLength(15), Validators.minLength(10),  Validators.pattern("^[0-9]*$"),])),
      city: new FormControl({ value: "", disabled: false }, Validators.required),
      postalCode: new FormControl(""),
    });

    contactForm: FormGroup;
    private readonly registrationModel: RegistrationModel;
    docfile: File = null;
    signatureFile: File = null;
    error: any;
    message: any;
    captcha = true;
    contact: FormArray;
    country: [];
    parish: [];
    contactCount = 1;
    fileName = [];
    submitClick = false;
    loginMessage: string;
    loading = true;
    fileCode: string;
    minMode: BsDatepickerViewMode = "day";
    bsConfig: Partial<BsDatepickerConfig>;
    imagePath: any;
    userdata: any;
    viewSingleUser: RegistrationReviewModel;
    viewTajUser: RegistrationTajModel;
    signaturePath: string;

    filtersLoaded: Promise<boolean>;

    public files: File[] = [];

    itemArray: Array<NavigationComponentType> = [];
    incomingData: any;
    userId: string = "";
    currentUserData: any;
    issueDate = new Date();
    expiryDate = new Date();


    saveResultEvent: EventEmitter<any> = new EventEmitter();
    processingEvent: EventEmitter<boolean> = new EventEmitter();
    errorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
    resultEvent: EventEmitter<any> = new EventEmitter();
    userDataResultEvent: EventEmitter<any> = new EventEmitter();
    updateEvent: EventEmitter<any> = new EventEmitter();
    userNameResultEvent: EventEmitter<any> = new EventEmitter();
    usernameErrorsEvent: EventEmitter<any> = new EventEmitter();

    updateErrorsEvent: EventEmitter<boolean> = new EventEmitter();
    updateProcessingEvent: EventEmitter<boolean> = new EventEmitter();
    updateResultEvent: EventEmitter<any> = new EventEmitter();
    updating: boolean = false;



    public navItem: NavigationItem;
    idExpiryDate: string;

    users: any;

    approved: number = 0;
    disableDropzone: boolean = false;
    fileUploadMessage: string = "";
    attachmentSaved: boolean = false;
    filesAdded: boolean = false;
    expiryYears: string = "";
    signatureErrorsEvent: EventEmitter<boolean> = new EventEmitter();
    signatureProcessingEvent: EventEmitter<boolean> = new EventEmitter();
    signatureUpdateResultEvent: EventEmitter<any> = new EventEmitter();
    signatureAvailable: boolean = false;
    passwordSet: boolean = true;

    rejectionAudit: any = null;

    filepickerClass = "btn btn-primary filePicker"
    appState: string = 'approved';

    // style
    color = 'black';


    ngOnInit(): void {

      this.urlData.itemArrayVal.subscribe(
        (itemArray) => (this.itemArray = itemArray)
      );
      this.urlData.urlData.subscribe(
        (incomingData) => (this.incomingData = incomingData)
      );
    //console.log(this.incomingData);
      this.userId = this.incomingData.split(",")[0];
      this.approved = this.incomingData.split(",")[1];
      this.appState = this.incomingData.split(",")[2].toLocaleLowerCase();

      if(this.appState == null || this.appState == 'null'){
        this.appState = 'approved';
      }
    

    //console.log(this.appState);

      if (this.approved == 0) {
        this.filepickerClass = "btn btn-primary filePicker disabled"
      } else if (this.approved == 1) {
        this.filepickerClass = "btn btn-primary filePicker"
      }

      this.screenWidth = window.innerWidth;


      this.loading = true;


      //country Lookup
      this.http
        .invokeGet2("/ref/lookup/UNSWCTYTAB", "")
        .subscribe((result: DataRequest) => {
          this.country = result.data;
        });
      //parish lookup
      this.http
        .invokeGet2("/ref/lookup/UNSWPARTAB", "")
        .subscribe((result: DataRequest) => {
          this.parish = result.data;
        });

      //find the users based on the user ID
      this.userNameResultEvent.subscribe((result) => {
        if (result.data) {


          if (result.data && this.approved == 1) {
            this.username = result.data.find((user) => user.id == this.userId)[
              "username"
            ];

          }
        }
      });

      this.errorsEvent.subscribe((error) => {
        // this.alert("Error", error[0].message, "error");
        // //delay closetab after 4 seconds
        // setTimeout(() => {
        //   this.closeTab();
        // }, 4000);
      });

      //getUser Data by ID
      this.resultEvent.subscribe((result) => {
        if (result.data) {
          this.viewSingleUser = result.data.applicantDto;
          this.viewTajUser = result.data.applicantReferenceDto;
          //check if signature is available
          if (result.data.userUpdateDto.signature == "No Signature Found" ||result.data.userUpdateDto.signature == null || result.data.userUpdateDto.signature == undefined || result.data.userUpdateDto.signature == "") {
            this.signatureAvailable = false;
            this.passwordSet = true;
          }else if(result.data.userUpdateDto.signature == 'No User Found' ){
            this.signatureAvailable = false;
            this.passwordSet = false;
          }
          else if (result.data.userUpdateDto.signature != "No Signature Found" || result.data.userUpdateDto.signature != 'No User Found' ||result.data.userUpdateDto.signature != null || result.data.userUpdateDto.signature != undefined || result.data.userUpdateDto.signature != "") {
            this.signatureAvailable = true;
            this.passwordSet = true;
            this.signatureImage = "data:image/jpg;base64," + result.data.userUpdateDto.signature;
          }
          
          

          this.userdata = result.data.applicantDto;
          this.issueDate = this.userdata.issueDate;
          this.expiryDate = this.userdata.expiryDate;

          if (this.userdata.postalCode) {
            this.userdata.postalCode = "";
          }

          if (this.userdata.telephone2 != null && this.userdata.telephone2 != "0000000000") {
            this.contactCount = this.contactCount + 1;
          } else if (this.userdata.telephone2 == null || this.userdata.telephone2 == "" || this.userdata.telephone2 == undefined || this.userdata.telephone2 == "null") {
            this.userdata.telephone2 = '';
          }
          if (this.userdata.telephone3 != null && this.userdata.telephone3 != "0000000000") {
            this.contactCount = this.contactCount + 1;
          } else if (this.userdata.telephone3 == null || this.userdata.telephone3 == "" || this.userdata.telephone3 == undefined || this.userdata.telephone3 == "null") {
            this.userdata.telephone3 = '';
          }

          if (this.userdata.image == false) {
            this.isImage = false;
            this.imagePath = this.userdata.idPicture;
            this.imagePath = "data:application/pdf;base64," + this.imagePath;
          } else {
            this.isImage = true;
            this.imagePath = "data:image/jpg;base64," + this.userdata.idPicture;
          }

          // this.signatureImage = this.userdata.signature;

          this.getIdType(this.userdata.idType);
        


        //RESET PASSWORD EVENTS

        this.resetPasswordResultEvent.subscribe(result => {
          if (result) {
            this.resetPasswordResult = result;

            Swal.fire("Reset Link Sent", result.data, "success").then((result) => {
            });
          }
        });

        this.resetPasswordErrorsEvent.subscribe(error => {
          if (error) {
            this.resetPasswordError = error[0].message;
          }
          this.alert('Error', 'The user has not set a password.', 'error');
        });

        this.resetPasswordProcessingEvent.subscribe(processing => {
          this.resetPasswordProcessing = processing;
        });
        this.revertResultsEvent.subscribe(result => {
          this.alert('Success', result, 'success');
        });


        this.revertErrorsEvent.subscribe(error => {
          this.alert('Error', error[0].message, 'error');
        });
        this.revertProcessingEvent.subscribe(processing => {
          this.revertProcessing = processing;
        })


        this.filtersLoaded = Promise.resolve(true);
        this.populateForm();
        this.formatDate(this.userdata.dob);
        this.loading = false;
      }
      });



      this.userDataResultEvent.subscribe((result) => {
        if (result.data) {
          this.currentUserData = result.data;
        }
      });

      this.updateErrorsEvent.subscribe((error) => {
        this.alert("Error", error[0].message, "error");
      });

      this.updateResultEvent.subscribe((result) => {
        this.alert("Success", "User Account Updated Successfully", "success");
        this.closeTab();
      });

      this.updateProcessingEvent.subscribe((processing) => {
        this.updating = processing;
      });

      this.auditResultEvent.subscribe((result) => {
      //console.log("audit");
      //console.log(result);
        this.rejectionAudit = result.data;
      });

      this.getUserName();
      this.initViewSingle();
      this.onGetAuditTrail();
    }

    private initViewSingle() {
      this.adminService.getSingleRegisteredUser(
        this.userId,
        this.processingEvent,
        this.resultEvent,
        this.errorsEvent
      );
    }


    addContact(): void {
      this.contactCount += 1;

      if (this.contactCount == 2) {
        this.userDetailsForm.controls.telephoneType2.setValue('');
        this.userDetailsForm.controls.telephone2.setValue("");
      } else if (this.contactCount == 3) {
        this.userDetailsForm.controls.telephoneType3.setValue('');
        this.userDetailsForm.controls.telephone3.setValue("");
      }
    }
    removeContact(): void {
      this.contactCount -= 1;
      console.log('contactCount', this.contactCount);

      if (this.contactCount == 2) {
        this.userDetailsForm.controls.telephoneType3.setValue('N/A');
        this.userDetailsForm.controls.telephone3.setValue("0000000000");

        //mark as only dirty when previous value is removed
        if(this.userdata.telephoneType3 != this.userDetailsForm.get('telephoneType3').value){
          this.userDetailsForm.controls.telephoneType3.markAsDirty();      //mark as dirty
        }
      
      } else if (this.contactCount == 1) {
        this.userDetailsForm.controls.telephoneType2.setValue('N/A');
        this.userDetailsForm.controls.telephone2.setValue("0000000000");
               //mark as dirty only when previous value is removed
               if(this.userdata.telephoneType2 != this.userDetailsForm.get('telephoneType2').value){
                this.userDetailsForm.controls.telephoneType2.markAsDirty();      //mark as dirty
              }
      }
    }

    private getUserName() {
      this.userService.getUsers(
        "approved",
        this.processingEvent,
        this.userNameResultEvent,
        this.usernameErrorsEvent
      );
    }


    deleteContact(index) {
      const creds = this.userDetailsForm.controls.contact as FormArray;
      creds.removeAt(index);
    }

    username: string = "";
    user = new Object();
    documentOwner: string = "";

    getUserNameById(id: number) {
      this.user = this.users.find((user) => user.id === this.userdata.id);

      if (this.user == null || this.user == "" || this.user == undefined) {
        this.approved = 0;
        this.username = "";
      } else {
        this.username = this.user["username"];
        this.documentOwner = this.username;
      }
    }

    //if the user is not approved, disable the form controls
    disableFormControls() {
      if (this.approved == 0) {
        return true;
      }
    }

    //populate form with data
    populateForm() {
      if (this.approved == 0) {
        this.userDetailsForm.disable();
        this.disableDropzone = this.disableFormControls();
      }
      this.userDetailsForm.setValue({
        firstName: this.userdata.firstName,
        middleName: this.userdata.middleName,
        lastName: this.userdata.lastName,
        trn: this.userdata.trn,
        dob: this.formatDate(this.userdata.dob),
        email: this.userdata.email,
        confirmEmail: this.userdata.email,
        street: this.userdata.street,
        town: this.userdata.city,
        parish: this.userdata.parish,
        country: this.userdata.country,
        idType: this.userdata.idType,
        idNumber: this.userdata.idNo,
        idPicture: this.userdata.idPicture,
        issueDate: this.formatDate(this.userdata.issueDate),
        expiryDate: this.formatDate(this.userdata.expiryDate),
        telephoneType1: this.userdata.telephoneType1,
        telephoneType2: this.nanValue(this.userdata.telephoneType2),
        telephoneType3: this.nanValue(this.userdata.telephoneType3),
        telephone1: this.userdata.telephone1,
        telephone2: this.zeroValue(this.userdata.telephone2),
        telephone3: this.zeroValue(this.userdata.telephone3),
        city: this.userdata.city,
        postalCode: "",
      });
      this.idExpiryDate = this.getExpiryDate(this.formatDate(this.userdata.expiryDate));

    }

    formatDate(date: Date) {
      let formatDate = new Date(date).toISOString().slice(0, 10).toString();
      return formatDate;
    }

    isImage = true;


    onFilesAdded(files: FileList) {



      //get filesize
      const fileSize = files[0].size;
      //if filesize > 10mb throw error
      if (fileSize > 10000000) {
        this.alert("Error", "File size is too large. File size must be less than 10MB", "error");
        return;
      }

    //console.log(files);
    //console.log(files[0]);
    //console.log(files.item(0));
    //console.log('files added');


      this.filesAdded = true;

      files[0].type.match("image.*")
        ? (this.isImage = true)
        : (this.isImage = false);

      if (
        files[0].type == "image/jpe" ||
        files[0].type == "image/jpeg" ||
        files[0].type == "image/png" ||
        files[0].type == "image/*"
      ) {
        this.isImage = true;
        this.userdata.image = true;
        this.userdata.idPicture = files[0];
      } else if (files[0].type == "application/pdf") {
        this.isImage = false;
        this.userdata.image = false;
        this.userdata.idPicture = files[0];
      }

      this.userDetailsForm.markAsDirty();
      this.getExpiryDate(this.userdata.expiryDate);


      const newFile = new File([files[0]], files[0].name, { type: files[0].type });
      this.docfile = newFile;
      // files.item(0) = this.docfile;


      // files.item.forEach((file) => {
      //   this.docfile = file;
      // });

      if (files) {
        // Convert file to data URL for preview
        const reader = new FileReader();
        reader.onload = (event: any) => {
          this.imagePath = event.target.result;
        };
        reader.readAsDataURL(files[0]);
      }

      this.clearIdDetails(); //make the id details empty when a new file is added
    }


    clearIdDetails() {
      this.userDetailsForm.controls.idType.setValue("");
      this.userDetailsForm.controls.idNumber.setValue("");
      this.userDetailsForm.controls.issueDate.setValue("");
      this.userDetailsForm.controls.expiryDate.setValue("");
    }

    public addFile(file: File): void {
      this.dropzone.filesAdded.emit([file]);
    }


    showImage = false;

    onAddNewPicture() {
      this.showImage = true;
    }

    showDropzone = false;

    onAddNewFile() {
      this.showDropzone = true;
    }

    closeTab() {
      this.itemArray.splice(this.itemArray.length - 1, 1);
      this.urlData.changeArray(this.itemArray);
      this.onAddItem("admin.user", this.userId + "," + this.approved);
    }

    onBack() {
      this.closeTab();
    }

    onAddItem(key: string, param: string) {
      this.navItem = { id: key, params: param };
      this.nav.navigate(this.navItem);
      this.urlData.changeParam(param);
    }


    onPopulate() {//populate appData
      const formData = new FormData();
      //checks if the form is interacted with and send the data
      if (this.docfile != null && this.docfile !== undefined) {
        formData.append("idPicture", this.docfile);
      }

      if (this.userId != null && this.userId !== "null") {
        formData.append("userID", this.userId);
      } else {
        formData.append("userID", null);
        this.alert("Error", "User ID is required", "error");
        this.closeTab();
      }

      if (
        this.userDetailsForm.controls.firstName.dirty &&
        this.userDetailsForm.controls.firstName.value != null &&
        this.userDetailsForm.controls.firstName.value !== "null"
      ) {
        formData.append("fName", this.userDetailsForm.controls.firstName.value);
      } else {
        formData.append("fName", "");
      }

      if (
        this.userDetailsForm.controls.lastName.dirty &&
        this.userDetailsForm.controls.lastName.value != null &&
        this.userDetailsForm.controls.lastName.value !== "null"
      ) {
        formData.append("lName", this.userDetailsForm.controls.lastName.value);
      } else {
        formData.append("lName", "");
      }

      if (
        this.userDetailsForm.controls.middleName.dirty &&
        this.userDetailsForm.controls.middleName.value != null &&
        this.userDetailsForm.controls.middleName.value !== "null"
      ) {
        formData.append("mName", this.userDetailsForm.controls.middleName.value);
      } else {
        formData.append("mName", "");
      }

      formData.append("trn", "");

      if (
        this.userDetailsForm.controls.dob.dirty &&
        this.userDetailsForm.controls.dob.value != null &&
        this.userDetailsForm.controls.dob.value !== "null"
      ) {
        formData.append(
          "dob",
          this.datePipe.transform(
            this.userDetailsForm.controls.dob.value,
            "yyyy-MM-dd"
          )
        );
      } else {
        formData.append("dob", "");
      }

      if (
        this.userDetailsForm.controls.email.dirty &&
        this.userDetailsForm.controls.email.value != null &&
        this.userDetailsForm.controls.email.value !== "null"
      ) {
        formData.append("email", this.userDetailsForm.controls.email.value);
      } else {
        formData.append("email", "");
      }

      if (
        this.userDetailsForm.controls.street.dirty &&
        this.userDetailsForm.controls.street.value != null &&
        this.userDetailsForm.controls.street.value !== "null"
      ) {
        formData.append("street", this.userDetailsForm.controls.street.value);
      } else {
        formData.append("street", "");
      }

      if (
        this.userDetailsForm.controls.city.dirty &&
        this.userDetailsForm.controls.city.value != null &&
        this.userDetailsForm.controls.city.value !== "null"
      ) {
        formData.append("city", this.userDetailsForm.controls.city.value);
      } else {
        formData.append("city", "");
      }

      if (
        this.userDetailsForm.controls.parish.dirty &&
        this.userDetailsForm.controls.parish.value != null &&
        this.userDetailsForm.controls.parish.value !== "null"
      ) {
        formData.append("parish", this.userDetailsForm.controls.parish.value);
      } else {
        formData.append("parish", "");
      }
      if (
        this.userDetailsForm.controls.country.dirty &&
        this.userDetailsForm.controls.country.value != null &&
        this.userDetailsForm.controls.country.value !== "null"
      ) {
        formData.append("country", this.userDetailsForm.controls.country.value);
      } else {
        formData.append("country", "");
      }
      if (
        this.userDetailsForm.controls.postalCode.dirty &&
        this.userDetailsForm.controls.postalCode.value != null &&
        this.userDetailsForm.controls.postalCode.value !== "null"
      ) {
        formData.append("zip", this.userDetailsForm.controls.postalCode.value);
      } else {
        formData.append("zip", "");
      }
      if (
        this.userDetailsForm.controls.telephone1.dirty &&
        this.userDetailsForm.controls.telephone1.value != null &&
        this.userDetailsForm.controls.telephone1.value !== "null"
      ) {
        formData.append("tel1", this.userDetailsForm.controls.telephone1.value);
      } else {
        formData.append("tel1", "");
      }
      if (this.userDetailsForm.controls.telephone2.dirty) {
        formData.append("tel2", this.userDetailsForm.controls.telephone2.value);
      } else {
        formData.append("tel2", "");
      }
      if (this.userDetailsForm.controls.telephone3.dirty) {
        formData.append("tel3", this.userDetailsForm.controls.telephone3.value);
      } else {
        formData.append("tel3", "");
      }
      if (
        this.userDetailsForm.controls.telephoneType1.dirty &&
        this.userDetailsForm.controls.telephoneType1.value != null &&
        this.userDetailsForm.controls.telephoneType1.value !== "null" &&
        this.userDetailsForm.controls.tel1.valid
      ) {
        formData.append(
          "telephoneType1",
          this.userDetailsForm.controls.telephoneType1.value
        );
      } else {
        formData.append("telephoneType1", "");
      }
      if (this.userDetailsForm.controls.telephoneType2.dirty || this.userDetailsForm.get('telephoneType2').invalid == true) {
        formData.append(
          "telephoneType2",
          this.userDetailsForm.controls.telephoneType2.value
        );
      } else {
        formData.append("telephoneType2", "");
      }
      if (this.userDetailsForm.controls.telephoneType3.dirty || this.userDetailsForm.get('telephoneType3').invalid == true) {
        formData.append(
          "telephoneType3",
          this.userDetailsForm.controls.telephoneType3.value
        );
      } else {
        formData.append("telephoneType3", "");
      }
      if (
        this.userDetailsForm.controls.idType.dirty &&
        this.userDetailsForm.controls.idType.value != null &&
        this.userDetailsForm.controls.idType.value !== "null"
      ) {
        formData.append("idType", this.userDetailsForm.controls.idType.value);
      } else {
        formData.append("idType", "");
      }
      if (
        this.userDetailsForm.controls.idNumber.dirty &&
        this.userDetailsForm.controls.idNumber.value != null &&
        this.userDetailsForm.controls.idNumber.value !== "null"
      ) {
        formData.append("idNo", this.userDetailsForm.controls.idNumber.value);
      } else {
        formData.append("idNo", "");
      }
      if (
        this.userDetailsForm.controls.issueDate.dirty &&
        this.userDetailsForm.controls.issueDate.value != null &&
        this.userDetailsForm.controls.issueDate.value !== "null"
      ) {
        formData.append(
          "issueDate",
          this.datePipe.transform(
            this.userDetailsForm.controls.issueDate.value,
            "yyyy-MM-dd"
          )
        );
      } else {
        formData.append("issueDate", "");
      }
      if (
        this.userDetailsForm.controls.expiryDate.dirty &&
        this.userDetailsForm.controls.expiryDate.value != null &&
        this.userDetailsForm.controls.expiryDate.value !== "null"
      ) {
        formData.append(
          "expiryDate",
          this.datePipe.transform(
            this.userDetailsForm.controls.expiryDate.value,
            "yyyy-MM-dd"
          )
        );
      } else {
        formData.append("expiryDate", "");
      }

      if (this.signatureFile != null) {
        formData.append("signature", this.signatureFile);
      }

      return formData;
    }



    onSubmit() {

      if (this.userId != null && this.userId != "null") {

        this.rs.updateRegistrationInfo(
          this.onPopulate(),
          this.updateProcessingEvent,
          this.updateResultEvent,
          this.updateErrorsEvent
        );
        this.userDetailsForm.markAsPristine(); //disable the submit button
      } else {
        this.alert(
          "Error",
          "User ID is missing from the application. Contact Support",
          "error"
        );
        this.closeTab();
      }
    }


    setContactCount() {
      if (
        this.userdata.telephoneType2 != null ||
        this.userdata.telephoneType2 != ""
      ) {
        this.contactCount = this.contactCount + 1;
      }
      if (
        this.userdata.telephoneType3 != null ||
        this.userdata.telephoneType3 != ""
      ) {
        this.contactCount = this.contactCount + 1;
      }
    }


    downloadPdf(base64String) {
      const source = base64String; // Use base64String parameter

      const link = document.createElement("a");
      link.href = source;
      //if this.username to string is null or empty, use the first and last name
      const fileName = this.username.toString() ?  this.username.toString()+ "_file.pdf" : this.userdata.firstName.toString()+'_'+ this.userdata.lastName.toString() + "_file.pdf"; // Corrected the fileName assignment
      link.download = fileName;
      link.click();
    }

    onClickDownloadPdf() {
      const base64String = this.imagePath;
      this.downloadPdf(base64String);
    }

    words: string[] = [];
    capitalizeEachWord(title: string) { //capitlaize formtitltes and field titles
      let words: string[] = [];

      if (title == null || title == undefined) {
        title = "";
      }
      // replace camel case with spaces
      title = title.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
      //convert string to array
      this.words = title.split(" ");
      //capitalize first letter of each word
      for (let i = 0; i < this.words.length; i++) {
        this.words[i] =
          this.words[i].charAt(0).toUpperCase() + this.words[i].slice(1);
      }

      //convert array back to string
      title = this.words.join(" ");

      return title;
    }

    capitalizeValidator(): Validators {
      return (control: AbstractControl): { [key: string]: any } | null => {
        const word = control.value.split(" ");
        const isCapitalized = word.every(
          (word) => word[0] === word[0].toUpperCase()
        );
        return isCapitalized ? { null: { value: control.value } } : null;
      };
    }

    //See how long until the ID expires
    // getExpiryDate(idExpiryDate: string) {
    //  //console.log(idExpiryDate);
    //   const expiryDate = new Date(idExpiryDate);
    //   const currentDate = new Date();

    //  //console.log("expiryDate");
    //  //console.log(expiryDate);
    //  //console.log("currentDate");
    //  //console.log(currentDate);

    //   if (expiryDate < currentDate) {
    //     this.idExpiryDate = "ID is expired";
    //     return "ID is expired";
    //   } else if (expiryDate.toString() == "Invalid Date") {
    //     this.idExpiryDate = "ID expiry date is invalid";
    //     return "ID expiry date is invalid";
    //   } else if (expiryDate.toString() == null || expiryDate.toString() == undefined || expiryDate.toString() == "" || expiryDate.toString() == "NaN") {
    //     this.idExpiryDate = "ID expiry date is missing";
    //     return "ID expiry date is missing";
    //   }

    //   const timeDifference = expiryDate.getTime() - currentDate.getTime();
    //  //console.log("timeDifference");
    //  //console.log(timeDifference);

    //   const years = Math.floor(timeDifference / (365 * 24 * 60 * 60 * 1000));
    //   const remainingMilliseconds =
    //     timeDifference - years * 365 * 24 * 60 * 60 * 1000;

    //   const months = Math.floor(
    //     remainingMilliseconds / (30 * 24 * 60 * 60 * 1000)
    //   );
    //  //console.log("months");
    //  //console.log(months);
    //   const remainingMillisecondsAfterMonths =
    //     remainingMilliseconds - months * 30 * 24 * 60 * 60 * 1000;

    //   const days = Math.floor(
    //     remainingMillisecondsAfterMonths / (24 * 60 * 60 * 1000)
    //   );

    //  //console.log("days");
    //  //console.log(days);

    //   let hasYears: string = `${years} years,`;
    //   let hasMonths: string = `${months} months,`;
    //   let hasDays: string = `${days} days`;

    //   if (years < 1) {
    //     hasYears = "";
    //   } else if (years == 1) {
    //     hasYears = `${years} year`;
    //   }
    //   if (months == 0) {
    //     hasMonths = "";
    //   } else if (months == 1) {
    //     hasMonths = `${months} month`;
    //   }
    //   if (days == 0) {
    //     hasDays = "";
    //   } else if (days == 1) {
    //     hasDays = `${days} day`;
    //   }

    //   this.idExpiryDate = `Client's ID expires in ${hasYears} ${hasMonths} ${hasDays}`;
    //   return this.idExpiryDate;
    // }

    // getExpiryDate(idExpiryDate: string) {
    //   const expiryDate = new Date(idExpiryDate);
    //   const currentDate = new Date();
    
    //   // Check for invalid date
    //   if (isNaN(expiryDate.getTime())) {
    //     this.idExpiryDate = "ID expiry date is invalid";
    //     return "ID expiry date is invalid";
    //   }
    
    //   // Check if the ID is already expired
    //   if (expiryDate < currentDate) {
    //     this.idExpiryDate = "ID is expired";
    //     return "ID is expired";
    //   }
    
    //   // Calculate the difference in years, months, and days
    //   let years = expiryDate.getFullYear() - currentDate.getFullYear();
    //   let months = expiryDate.getMonth() - currentDate.getMonth();
    //   let days = expiryDate.getDate() - currentDate.getDate();
    
    //   // Adjust months for expiryDate being earlier in the year than currentDate
    //   if (months < 0 || (months === 0 && days < 0)) {
    //     years--;
    //     months += 12; // Adding 12 months to the negative month difference
    //   }
    
    //   // Adjust days for expiryDate being earlier in the month than currentDate
    //   if (days < 0) {
    //     months--;
    //     // Add the number of days in the previous month to the day difference
    //     const previousMonth = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), 0);
    //     days += previousMonth.getDate();
    //   }
    
    //   // Format the output
    //   const yearString = years === 1 ? "1 year" : years > 1 ? `${years} years` : "";
    //   const monthString = months === 1 ? "1 month" : months > 1 ? `${months} months` : "";
    //   const dayString = days === 1 ? "1 day" : days > 1 ? `${days} days` : "";
    
    //   this.idExpiryDate = `Client's ID expires in ${[yearString, monthString, dayString].filter(Boolean).join(", ")}`;
    //   return this.idExpiryDate;
    // }

  //   getExpiryDate(idExpiryDate) {
  //     const expiryDate = new Date(idExpiryDate);
  //     const currentDate = new Date();

  //     // Check for invalid date
  //     if (isNaN(expiryDate.getTime())) {
  //         this.idExpiryDate = "ID expiry date is invalid";
  //         return "ID expiry date is invalid";
  //     }

  //     // Check if the ID is already expired
  //     if (expiryDate < currentDate) {
  //         this.idExpiryDate = "ID is expired";
  //         return "ID is expired";
  //     }
  //     if (expiryDate == currentDate) {
  //       this.idExpiryDate = "ID is expired";
  //       return "ID is expired";
  //   }

  //     // Calculate the difference in years, months, and days
  //     let years = expiryDate.getFullYear() - currentDate.getFullYear();
  //     let months = expiryDate.getMonth() - currentDate.getMonth();
  //     let days = expiryDate.getDate() - currentDate.getDate();

  //     // Adjust for negative months or days
  //     if (days < 0) {
  //         months--;
  //         const previousMonth = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), 0);
  //         days += previousMonth.getDate();
  //     }

  //     if (months < 0) {
  //         years--;
  //         months += 12;
  //     }

  //     // Format the output
  //     const yearString = years === 1 ? "1 year" : years > 1 ? `${years} years` : "";
  //     const monthString = months === 1 ? "1 month" : months > 1 ? `${months} months` : "";
  //     const dayString = days === 1 ? "1 day" : days > 1 ? `${days} days` : "";

  //     this.idExpiryDate = `Client's ID expires in ${[yearString, monthString, dayString].filter(Boolean).join(", ")}`;
  //     return this.idExpiryDate;
  // }


  getExpiryDate(idExpiryDate) {
      // Parse the date string manually
      const [year, month, day] = idExpiryDate.split('-').map(Number);
      // Create a new Date object using the extracted values
      const expiryDate = new Date(year, month - 1, day); // Month is indexed from 0
    
    const currentDate = new Date();

    // Check for invalid date
    if (isNaN(expiryDate.getTime())) {
        this.idExpiryDate = "ID expiry date is invalid";
        return "ID expiry date is invalid";
    }

    // Check if the ID is already expired
    if (expiryDate < currentDate) {
        this.idExpiryDate = "ID is expired";
        return "ID is expired";
    }

    // Calculate the difference in years, months, and days
    let years = expiryDate.getFullYear() - currentDate.getFullYear();
    let months = expiryDate.getMonth() - currentDate.getMonth();
    let days = expiryDate.getDate() - currentDate.getDate();

    // Adjust for negative days
    if (days < 0) {
        months--;
        const previousMonth = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), 0);
        //add 1 day to days
        days += previousMonth.getDate() + 1 ;   
      }

    // Adjust for negative months
    if (months < 0) {
        years--;
        months += 12;
    }

    // Format the output
    const yearString = years === 1 ? "1 year" : years > 1 ? `${years} years` : "";
    const monthString = months === 1 ? "1 month" : months > 1 ? `${months} months` : "";
    const dayString = days === 1 ? "1 day" : days > 1 ? `${days} days` : "";

    if(years == 0 && months == 0 && days == 0 || currentDate == expiryDate  ){
      this.idExpiryDate = "ID expires at the end of today";
      return "ID expires at the end of today";
    }

    this.idExpiryDate = `Client's ID expires in ${[yearString, monthString, dayString].filter(Boolean).join(", ")}`;
    return this.idExpiryDate;
  }


    // Custom validator function to check if DOB is not greater than 18 years old
    dobNotGreaterThan18(): ValidatorFn {
      return (control: AbstractControl): { [key: string]: any } | null => {
        const selectedDate = new Date(control.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to midnight for today's date

        // Calculate the date 18 years ago from today
        const eighteenYearsAgo = new Date(today);
        eighteenYearsAgo.setFullYear(today.getFullYear() - 18);

        if (selectedDate > eighteenYearsAgo) {
          return { dobExceeds18Years: true };
        }

        return null; // DOB is not greater than 18 years old
      };
    }

    //check if the date is not greater than tomorrow
    dateNotGreaterThanTomorrow(): ValidatorFn {
      return (control: AbstractControl): { [key: string]: any } | null => {
        const selectedDate = new Date(control.value);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate());

        if (selectedDate > tomorrow) {
          return { dateNotGreaterThanTomorrow: true };
        }

        return null;
      };
    }

    getIdType(idType: string) {

      if (idType == null || idType == undefined || idType == "") {

      } else {
        this.userDetailsForm.controls.idType.updateValueAndValidity(); //revalidate the idtype
        this.userDetailsForm.controls.expiryDate.updateValueAndValidity(); //revalidate the expiry date
        if (idType.includes("Driver")) {
          this.expiryYears = "Five Years";
        } else if (idType.includes("Passport")) {
          this.expiryYears = "Ten Years";
        } else if (idType.includes("Voter") || idType.includes("National")) {
          this.expiryYears = "Ten Years";
        } else {
          this.expiryYears = "Ten Years";
        }
      }
    }
    //check if the expiry date is not greater than the allowed years
    expiryDateValidator(): ValidatorFn {
      return (control: AbstractControl): { [key: string]: any } | null => {
          const selectedDate = new Date(control.value);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set time to midnight for today's date

          if (selectedDate >= today) { // Adjusted to include today
              const idType = this.userDetailsForm.get("idType").value;
              const issueDate = new Date(this.userDetailsForm.get("issueDate").value);

              if (
                  idType === "Driver's Licence" ||
                  idType === "Voter's ID" ||
                  idType === "National ID"
              ) {
                  const maxExpiryDate = new Date(issueDate);
                  maxExpiryDate.setFullYear(issueDate.getFullYear() + 5);
                  this.expiryYears = "FIVE years";

                  if (selectedDate > maxExpiryDate) {
                      this.color = 'red';
                      return { dateExceeds5Years: true };
                  }
              } else if (idType === "Passport") {
                  const maxExpiryDate = new Date(issueDate);
                  maxExpiryDate.setFullYear(issueDate.getFullYear() + 10);
                  this.expiryYears = "TEN years";

                  if (selectedDate > maxExpiryDate) {
                      this.color = 'red';
                      return { dateExceeds10Years: true };
                  }
              }

              return null; // Date is within the allowed range
          }

          this.color = 'red';
          return { dateExceedsToday: true }; // Expiry date is in the past
      };
  }


    //compare two dates
    compareDate(jswift: Date, taj: Date) {
      if (jswift == null || taj == null) {
        return false;
      } else {
        let jswiftDate = this.datepipe.transform(jswift, "yyyy-MM-dd");
        let tajDate = this.datepipe.transform(taj, "yyyy-MM-dd");
        if (jswiftDate === tajDate) {
          return true;
        }
      }
    }

    //compare two strings
    compareString(jswift: string, taj: string) {
      if (jswift == null || taj == null) {
        return false;
      } else {
        if (jswift.toUpperCase() === taj.toUpperCase()) {
          return true;
        }
      }
    }

    alert(title: string, message: string, icon: any) { //custom Swal alert function
      Swal.fire(title, message, icon).then((result) => {
        if (icon == "success" || icon == "info") {
          this.onBack();
        }
      });
    }

    //change to sentence case
    changeToSentenceCase(str: string, control: string) {
    //console.log(str);
      if (str == null || str == undefined || str == "") {
        // do nothing
      }//else if(str.match(/^Mc.*/ || /^O.*/)){
      //   this.userDetailsForm.controls[control].setValue(str[0].toUpperCase() + str[1].toLowerCase() +  str[2].toUpperCase() + str.slice(3));
      // }
      else {
        this.userDetailsForm.controls[control].setValue(str[0].toUpperCase() + str.slice(1));
      }
    }


    // USER SETTINGS
    private readonly resetPasswordModel: resetPasswordModel;

    resetPasswordErrorsEvent: EventEmitter<any> = new EventEmitter();
    resetPasswordResultEvent: EventEmitter<any> = new EventEmitter();
    resetPasswordProcessingEvent: EventEmitter<boolean> = new EventEmitter();

    resetPasswordResult: string;
    resetPasswordMessage: string;
    resetPasswordError: string;
    resetPasswordProcessing: boolean = false;
    revertProcessing: boolean = false;
    RevertUserData: {};
    disableResetPasswordBtn: boolean = false;
    userStatus = new UserStatus();
    revertProcessingEvent: EventEmitter<any> = new EventEmitter();
    revertResultsEvent: EventEmitter<any> = new EventEmitter();
    revertErrorsEvent: EventEmitter<any> = new EventEmitter();
    $processingEvent: EventEmitter<boolean> = new EventEmitter();
    $errorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
    $saveResultEvent: EventEmitter<any> = new EventEmitter();
    $resultEvent: EventEmitter<any> = new EventEmitter();



    onResetPassword() {
      this.resetPasswordModel.email = this.userdata.email;
      this.rs.resetPasswordEmail(this.resetPasswordModel, this.resetPasswordProcessingEvent, this.resetPasswordResultEvent, this.resetPasswordErrorsEvent);
      this.disableResetPasswordBtn = true;
    }

    onSendPasswordEmail() {
      // this.setToRejected();
      this.setToApproved();
    }

    setToApproved() {
      this.userStatus = new UserStatus();
      this.userStatus.userId = this.userId.toString();
      this.userStatus.state = { status: 'APPROVED' };
      this.adminService.updateUserStatus(this.userStatus, this.processingEvent, this.resultEvent, this.errorsEvent);
    }

    setToRejected() {
      this.userStatus = new UserStatus();
      this.userStatus.userId = this.userId.toString();
      this.userStatus.state = { status: 'SUBMITTED' };
      this.adminService.updateUserStatus(this.userStatus, this.processingEvent, this.resultEvent, this.errorsEvent);
    }



    onResendCreatePasswordLink() {
      this.RevertUserData = {
        "user_id": this.userId
      }
      this.adminService.resendCreatePasswordLink(this.RevertUserData, this.revertProcessingEvent, this.revertResultsEvent, this.revertErrorsEvent);
    }

    onRestPassowrd() {
      this.resetPasswordModel.email = this.userdata.email;
      this.rs.resetPasswordEmail(this.resetPasswordModel, this.$processingEvent, this.$resultEvent, this.$errorsEvent);
    }

    //user signature

    imgResultBeforeCompression: string = '';
    signatureImage: string = '';


    CompressSignature(files: File[]) {

      if(this.passwordSet == false ){
        this.alert("Error", "User has not yet set a password", "error");
        return
      }else{

        this.userDetailsForm.markAsDirty();
        // Check if any file is present
        if (!files || files.length === 0) {
          // this.alert('Error', 'No files added', 'error');
          console.error('No files added');
          this.signatureAvailable = false;
          return;
        }

        const file: File = files[0];
        this.signatureFile = file;


        if (file) {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
          this.signatureAvailable = true;

          if (!allowedTypes.includes(file.type)) {
            // if invalid file type
            this.alert("Error", 'Invalid file type. Please select an image file (JPEG, JPG, PNG).', 'error');
          } else {
            // Convert file to data URL for preview
            const reader = new FileReader();
            reader.onload = (event: any) => {
              this.imgResultBeforeCompression = event.target.result;
              this.compressFile(this.imgResultBeforeCompression, file);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }

    compressFile(image: string, file: File) {
      //console.log('Size before compression:', file.size);
      this.imageCompress.compressFile(image, -1, 100, 100).then(
        result => {
          this.signatureImage = result;
          //console.log('Size after compression:', this.imageCompress.byteCount(result));
        }
      );
    }



    onSignatureAdded(files: FileList) {
    //console.log(files);
    //console.log(files[0]);
    //console.log(files.item(0));
    //console.log('files added');

      this.filesAdded = true;

      files[0].type.match("image.*")
        ? (this.isImage = true)
        : (this.isImage = false);

      if (
        files[0].type == "image/jpe" ||
        files[0].type == "image/jpeg" ||
        files[0].type == "image/png" ||
        files[0].type == "image/*"
      ) {
        this.isImage = true;
        this.userdata.image = true;
      } else if (files[0].type == "application/pdf") {
        this.isImage = false;
        this.userdata.image = false;
      }

      this.getExpiryDate(null);
      this.userDetailsForm.markAsDirty();

      // files[0] = this.docfile;
      // files.item(0) = this.docfile;


      // files.item.forEach((file) => {
      //   this.docfile = file;
      // });

      if (files) {
        // Convert file to data URL for preview
        const reader = new FileReader();
        reader.onload = (event: any) => {
          this.imagePath = event.target.result;
        };
        reader.readAsDataURL(files[0]);
      }

      this.clearIdDetails(); //make the id details empty when a new file is added
    }

    screenWidth: number;
    //get screen widht once is resized
    @HostListener('window:resize', ['$event'])
    onResize(event?: Event): void {
      this.screenWidth = window.innerWidth;
    //console.log(this.screenWidth);
    }


    reCalculateExpiryDate() {
      this.userDetailsForm.controls.expiryDate.updateValueAndValidity();
    }


    //return error message based on form control validations
    getErrorMessage(control: string) {
      if (this.userDetailsForm.controls[control].hasError('required')) {
        return `Error: ${this.capitalizeEachWord(control)}  is required`;
      } else if (this.userDetailsForm.controls[control].hasError('email')) {
        return 'Error: Not a valid email';
      } else if (this.userDetailsForm.controls[control].hasError('pattern')) {
              //if control is emaill 
              if(control == "email"){
                return "'Error: Invalid email format";
              }else if(control == "telephone1" || control == "telephone2" || control == "telephone3"){
                return "'Error: Invalid phone number";
              }else if(control == 'firstName' || control == 'middleName' || control == 'lastName'){
                return `'Error: Invalid ${this.capitalizeEachWord(control)} format`;
              }else{
                return 'Error: Invalid format';
              }
      } else if (this.userDetailsForm.controls[control].hasError('minlength')) {
        return 'Error: Minimum length is ' + this.userDetailsForm.controls[control].getError('minlength').requiredLength;
      } else if (this.userDetailsForm.controls[control].hasError('maxlength')) {
        return 'Error: Maximum length is ' + this.userDetailsForm.controls[control].getError('maxlength').requiredLength;
      } else if (this.userDetailsForm.controls[control].hasError('dobExceeds18Years')) {
        return 'Error: Client must be 18 years or older';
      } else if (this.userDetailsForm.controls[control].hasError('dateExceedsToday')) { 
        return 'Error: ID is expired';
      } else if (this.userDetailsForm.controls[control].hasError('dateExceeds5Years')) {
        return 'Error: Expiry date cannot exceed 5 years from issue date';
      } else if (this.userDetailsForm.controls[control].hasError('dateExceeds10Years')) {
        return 'Error: Expiry date cannot exceed 10 years from issue date';
      } else if (this.userDetailsForm.controls[control].hasError('dateNotGreaterThanTomorrow')) {
        return 'Error: Date cannot be in the future';
      } else if (this.userDetailsForm.controls[control].hasError('null')) {
        return 'Error: This field is required';
      } else if (this.userDetailsForm.controls[control].hasError('telephoneType')) {
        return 'Error: Telephone type is required';
      } else if (this.userDetailsForm.controls[control].hasError('telephoneType2')) {
        return 'Error: Telephone type is required';
      } else if (this.userDetailsForm.controls[control].hasError('telephoneType3')) {
        return 'Error: Telephone type is required';
      }
    }


    auditProcessingEvent: EventEmitter<boolean> = new EventEmitter();
    auditResultEvent: EventEmitter<any> = new EventEmitter();
    auditErrorsEvent: EventEmitter<any> = new EventEmitter();


    onGetAuditTrail() {
      if(this.appState == 'rejected'){
        this.rs.getRejectReasons(this.userId, this.auditProcessingEvent, this.auditResultEvent, this.auditErrorsEvent);
      }else if( this.appState == 'approved'){
        //get audit trail
      }
    }


    zeroValue(control: string) {
      if(control == "0000000000"){
        return ""
      }
      return control;
    }

    nanValue(control: string) {
      if(control == "N/A"){
        return ""
      }
      return control;
    }

    //set one control to required based on the value of another control
    createValidation(initialControl:string,requiredControl:string){
      if( this.userDetailsForm.controls[initialControl].valid ){
        this.userDetailsForm.controls[requiredControl].setValidators([Validators.required]);
        this.userDetailsForm.controls[requiredControl].updateValueAndValidity();
      }else{
       // this.userDetailsForm.controls[requiredControl].clearValidators();
       console.log("clear");
      }
    }
  }
