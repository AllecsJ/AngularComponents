import { Component, EventEmitter, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { UserManagementService } from "../../../../app/modules/user-management-module/user-management.service";
import { UserStatus } from "../../../shared/models/registration.model";
import { DataServiceError } from "../../../core/helpers/http/HttpModel";
import {
  CojDirectorModel,
  CompanyDirectorDetails,
  CompanyDirectorModel,
  CompanyFiles,
  DirectorsModel,
} from "../../../shared/models/companyDirector.model";
import Swal from "sweetalert2";
import { environment } from "../../../../environments/environment";
import { NavigationComponentType } from "../../../shared/service/tree.service";
import { ParamService } from "../../../shared/service/param.service";
import {
  NavigationItem,
  NavigationService,
} from "../../../shared/service/navigation.service";
import { AttachmentService } from "../../../shared/forms/attachment-form/attachment.service";
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
import {
  BsDatepickerConfig,
  BsDatepickerViewMode,
} from "ngx-bootstrap/datepicker";
import { Subject } from "rxjs";
import { HttpUtils } from "src/app/core/helpers/http/HttpUtils";
import { DataRequest } from "../../../core/helpers/http/HttpModel";
import { AuthenticationService } from "src/app/core/auth/services/authentication.service";
import { min } from "rxjs/operators";

@Component({
  selector: "app-entity-chief-details",
  templateUrl: "./entity-chief-details.component.html",
  styleUrls: ["./entity-chief-details.component.css"],
})
export class EntityChiefDetailsComponent implements OnInit {
  public static defineNavigation() {
    return {
      id: "entity-chief-details",
      component: EntityChiefDetailsComponent,
      tabTitle: "Entity Chief Details",
      windowTitle: "Single Window",
      singleton: true,
      accessors: ["Admin.user"],
      params: null,
    };
  }

  constructor(
    private rs: UserManagementService,
    private route: ActivatedRoute,
    private router: Router,
    private urlData: ParamService,
    private nav: NavigationService,
    private _atService: AttachmentService,
    public datepipe: DatePipe,
    public fb: FormBuilder,
    public http: HttpUtils,
    public auth: AuthenticationService
  ) {}

  private sub: any;
  private entityStatus: any;
  userId;
  endpoint = environment.applicationServerURL + "/director/application/uploads";
  public directorState: UserStatus;
  filtersLoaded: Promise<boolean>;
  public navItem: NavigationItem;
  itemArray: Array<NavigationComponentType> = [];
  viewSingleDirector: CompanyDirectorModel;
  viewSingleDirectorCompany: CompanyDirectorDetails;
  companyDetails: CompanyDirectorDetails;
  viewSingleDirectorFiles: CompanyFiles[];
  imageData;
  fileName: string;

  rejectionAudit: any = null;

  cojDirector: CojDirectorModel;
  directors: DirectorsModel[];
  processingEvent: EventEmitter<boolean> = new EventEmitter();
  errorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  resultEvent: EventEmitter<any> = new EventEmitter();
  updateEvent: EventEmitter<any> = new EventEmitter();
  rejectEvent: EventEmitter<any> = new EventEmitter();
  fileDownloadResultEvent: EventEmitter<any> = new EventEmitter();
  fileProcessingEvent: EventEmitter<boolean> = new EventEmitter();
  fileErrorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  approved = null;

  //ADDED variables
  // companyDirectorForm: FormGroup;
  filesForm: FormGroup;
  contactForm: FormGroup;
  error: any;
  path: string;
  message: any;
  userData: any;
  errorFile: string;
  // fileName: string;
  contactCount = 1;
  loading = true;
  dtTrigger = new Subject();
  files: FormArray;
  fileData: Array<File> = [];
  docType: Array<string> = [];
  private readonly companyDirectorModel: CompanyDirectorModel;
  minMode: BsDatepickerViewMode = "day";
  bsConfig: Partial<BsDatepickerConfig>;

  $processingEvent: EventEmitter<boolean> = new EventEmitter();
  $errorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  $resultEvent: EventEmitter<any> = new EventEmitter();
  $initEvent: EventEmitter<any> = new EventEmitter();
  updateProcessingEvent: EventEmitter<boolean> = new EventEmitter();
  updateErrorsEvent: EventEmitter<boolean> = new EventEmitter();
  updateResultEvent: EventEmitter<boolean> = new EventEmitter();

  private data: any;
  countries: [];
  parishes: [];
  incomingData: any;
  hasUploadedFiles: boolean = false;
  pageDisabled: boolean = true;
  pageActive: boolean = true;

  formLoading: boolean = true;
  formResult: any;
  formError: Boolean = null;
  formErrorMessage: String = null;
  entityId: string;
  appState: string = 'approved';

  ngOnInit() {
    this.urlData.itemArrayVal.subscribe(
      (itemArray) => (this.itemArray = itemArray)
    );
    //param data passed by the previous component
    this.urlData.urlData.subscribe((sub) => (this.incomingData = sub));
    //set the user id as sub
    this.sub = this.incomingData.split(",")[0];
    this.entityId = this.incomingData.split(",")[0];
    this.appState = this.incomingData.split(",")[2];  
   //console.log('app state', this.appState);
    //set the entity status - if approved or not approved
    this.entityStatus = this.incomingData.split(",")[1];
    this.approved = this.entityStatus;


    //diables form when not approved
    this.disableFormIfNotApproved();

    this.processingEvent.subscribe((result) => {
      this.formLoading = result;
     //console.log("processing event");
     //console.log(result);
    });

    this.resultEvent.subscribe((result) => {
      if (result.data) {
       //console.log("result event");
       //console.log(result);
        this.viewSingleDirectorCompany = result.data;
       //console.log("this.viewSingleDirectorCompany");
       //console.log(this.viewSingleDirectorCompany);
        this.viewSingleDirector = result.data.directorDto;
       //console.log("this.viewSingleDirector");
       //console.log(this.viewSingleDirector);
        this.viewSingleDirectorFiles = result.data.uploadedDocuments;
       //console.log("this.viewSingleDirectorFiles");
       //console.log(this.viewSingleDirectorFiles);
        this.directors = result.data.directorSummary;
       //console.log("this.directors");
       //console.log(this.directors);
        this.cojDirector = result.data.cojReferenceDto;
       //console.log("this.cojDirector");
       //console.log(this.cojDirector);
        this.filtersLoaded = Promise.resolve(true);
        this.populateForm();
      }
    });

    this.fileDownloadResultEvent.subscribe((result) => {
      if (result) {
        this.imageData = result.data["fileBytes"];
        const linkSource = "data:application/pdf;base64," + this.imageData;
        const downloadLink = document.createElement("a");
        const fileName = this.fileName;
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
      }
    });

    this.errorsEvent.subscribe((result) => {
      if (result.length > 0) {
        this.formError = true;
        this.formErrorMessage = result[0].message;
      }
    });

    this.updateProcessingEvent.subscribe((processing) => {
     //console.log("update processing event");
     //console.log(processing);
    });
    this.updateErrorsEvent.subscribe((error) => {
      if (error.length > 0) {
        this.alert("Error", error[0].message, "error");
      }
    });

    this.updateResultEvent.subscribe((result) => {
      if (result.data) {
        this.alert("Success", "Entity details updated successfully", "success");
      }
    });

    //country lookup
    this.http
      .invokeGet2("/ref/lookup/UNSWCTYTAB", "")
      .subscribe((result: DataRequest) => {
        this.countries = result.data;
      });
    //parish lookup
    this.http
      .invokeGet2("/ref/lookup/UNSWPARTAB", "")
      .subscribe((result: DataRequest) => {
        this.parishes = result.data;
      });
      this.auditResultEvent.subscribe((result) => {
       //console.log(result);
        this.rejectionAudit = result.data;
      });
    this.initViewSingle();
    this.onGetAuditTrail();
  }

  private initViewSingle() {
    this.rs.getSingleRegisteredDirector(
      this.sub,
      this.processingEvent,
      this.resultEvent,
      this.errorsEvent
    );
  }

  onAddItem(key: string, param: string) {
    this.navItem = { id: key, params: param };
    this.nav.navigate(this.navItem);
    this.urlData.changeParam(param);
  }

  closeTab() {
    this.itemArray.splice(this.itemArray.length - 1, 1);
    this.urlData.changeArray(this.itemArray);
  }
  onBack() {
    this.closeTab();
    this.onAddItem("admin.company", "");
  }

  private disableFormIfNotApproved() {
    if (this.entityStatus != 1) {
      this.companyDirectorForm.disable();
    }
  }

  downloadFile(uid: string, fileName: string) {
    this.fileName = fileName;
    this._atService.downloadFile(
      uid,
      this.fileProcessingEvent,
      this.fileDownloadResultEvent,
      this.fileErrorsEvent
    );
  }

  companyDirectorForm = new FormGroup({
    entityName: new FormControl("", Validators.required),
    entityTrn: new FormControl(
      { value: "", disabled: false },
      Validators.compose([
        Validators.required,
        Validators.minLength(13),
        Validators.maxLength(13),
      ])
    ),
    entityType: new FormControl("", Validators.required),
    registrationNumber: new FormControl("", Validators.required),
    registrationDate: new FormControl(
      "",
      Validators.compose([
        Validators.required,
        this.dateNotGreaterThanTomorrow(),
      ])
    ),
    firstName: new FormControl({ value: "", disabled: true }),
    middleName: new FormControl({ value: "", disabled: true }),
    lastName: new FormControl({ value: "", disabled: true }),
    jobTitle: new FormControl("", Validators.required),
    trn: new FormControl({ value: "", disabled: true }, Validators.required),
    email: new FormControl("", [
      Validators.required,
      Validators.compose([
        Validators.required,
        Validators.pattern(
          '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
        ),
      ]),
    ]),
    telephone1: new FormControl(
      null,
      Validators.compose([
        Validators.required,
        Validators.maxLength(15),
        Validators.minLength(10),
        Validators.pattern("^[0-9]*$"),

      ])
    ),
    telephone2: new FormControl(
      null,
      Validators.compose([
        Validators.maxLength(15),
        Validators.minLength(10),
        Validators.pattern("^[0-9]*$"),


      ])
    ),
    telephone3: new FormControl(
      null,
      Validators.compose([
        Validators.maxLength(15),
        Validators.minLength(10),
        Validators.pattern("^[0-9]*$"),



      ])
    ),
    street: new FormControl("", Validators.required),
    city: new FormControl(""),
    parish: new FormControl("", Validators.required),
    country: new FormControl("", Validators.required),
  });

  addFile(): void {
    const creds = this.companyDirectorForm.controls.files as FormArray;
    if (
      this.filesForm.controls.docType.value != null &&
      this.fileName != null
    ) {
      this.errorFile = null;
      creds.push(
        this.fb.group({
          docType: this.filesForm.controls.docType.value,
          fileName: this.fileName,
        })
      );
    } else {
      this.errorFile = "Please attach a file";
    }
    this.filesForm.reset();
  }

  //convert string date to yyyy-MM-dd
  formatDate(date: Date) {
    let formatDate = new Date(date).toISOString().slice(0, 10).toString();
    return formatDate;
  }

  checkIfStringNull(value: any) {
    if (value == "null" || value == null || value == "") {
      return "";
    } else {
      return value;
    }
  }

  populateForm() {
    const formData = new FormData();

    this.companyDirectorForm.setValue({
      entityName: this.checkIfStringNull(this.viewSingleDirectorCompany.name),
      entityTrn: this.checkIfStringNull(
        this.viewSingleDirectorCompany.companyTrn
      ),
      entityType: this.checkIfStringNull(this.viewSingleDirectorCompany.type),
      registrationNumber: this.checkIfStringNull(
        this.viewSingleDirectorCompany.regNo
      ),
      registrationDate: this.checkIfStringNull(
        this.datepipe.transform(
          this.viewSingleDirectorCompany.regDate,
          "yyyy-MM-dd"
        )
      ),
      firstName: this.checkIfStringNull(this.viewSingleDirector.firstName),
      middleName: this.checkIfStringNull(
        this.viewSingleDirector.middleName
          ? this.viewSingleDirector.middleName
          : ""
      ),
      lastName: this.checkIfStringNull(this.viewSingleDirector.lastName),
      jobTitle: this.checkIfStringNull(
        this.viewSingleDirector.jobTitle ? this.viewSingleDirector.jobTitle : ""
      ),
      trn: this.checkIfStringNull(this.viewSingleDirector.employeeTrn),
      email: this.checkIfStringNull(this.viewSingleDirectorCompany.email),
      telephone1: this.checkIfStringNull(
        this.viewSingleDirector.telephone_1
          ? this.viewSingleDirector.telephone_1
          : ""
      ),
      telephone2: this.checkIfStringNull(
        this.viewSingleDirector.telephone_2
          ? this.viewSingleDirector.telephone_2
          : ""
      ),
      telephone3: this.checkIfStringNull(
        this.viewSingleDirector.telephone_3
          ? this.viewSingleDirector.telephone_3
          : ""
      ),
      street: this.checkIfStringNull(
        this.viewSingleDirector.street ? this.viewSingleDirector.street : ""
      ),
      city: this.checkIfStringNull(
        this.viewSingleDirector.city ? this.viewSingleDirector.city : ""
      ),
      parish: this.checkIfStringNull(
        this.viewSingleDirector.parish ? this.viewSingleDirector.parish : ""
      ),
      country: "Jamaica",
    });

   //console.log("is form valid");
   //console.log(this.companyDirectorForm.valid);

    if (this.viewSingleDirectorFiles.length > 0) {
      this.hasUploadedFiles = true;
    } else {
      this.hasUploadedFiles = false;
    }

    return this.companyDirectorForm.value;
  }

  //validate issue date not greater than tomorrow
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

  //diable forms when status is not approved
  onDisableForm() {
    if (this.entityStatus != 1) {
      this.companyDirectorForm.disable();
    }
  }

  compareTrn(jswift: string, taj: string) {
    if (jswift == null || taj == null) {
      return false;
    } else if (jswift.toUpperCase() == taj.toUpperCase()) {
      return true;
    } else if(jswift.length == 9 || taj.length == 9){
     //take first 9
    }
  }
  compareString(jswift: string, taj: string) {
    if (jswift == null || taj == null) {
      return false;
    } else {
      if (jswift.toUpperCase() === taj.toUpperCase()) {
        return true;
      }
    }
  }
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
  CompareTrnWithSlash(jswift: string, taj: string) {
    ////console.log('compare with slash');
  
    // Check for null or undefined values
    if (jswift == null || taj == null) {
      return false;
    }
  
    // Check if taj contains a slash
    if (taj.includes("/")) {
      // Split taj at the slash
      let tajParts = taj.split("/");
  
      // Ensure there are exactly two parts after the split
      if (tajParts.length !== 2) {
        return false;
      }
  
      //get the first 9 characters of the jswifttrn
      let jswiftTrn = jswift.substring(0, 9);
      let jswiftBranch = jswift.substring(9, jswift.length);
  
      //replace 0 with string
      jswiftBranch = jswiftBranch.replace(/^0+/, "");
      //trim string
      jswiftBranch = jswiftBranch.trim();
  
      //put together
      let newJswift = jswiftTrn + "/" + jswiftBranch;
  
      //compare
      if (newJswift == taj) {
        return true;
      } else {
        return false;
      }
    } else {
      // If taj does not contain a slash, just compare directly
      this.compareTrn(jswift, taj);
    }
  }

  compareEntityType(jswift: string, taj: string) {
    if (jswift == null || taj == null) {
      return false;
    } else if (
      taj.toLowerCase() == "sole trader" ||
      taj.toLowerCase() == "sole proprietorship"
    ) {
      let entityType = "Business";

      return jswift.toLowerCase() == entityType.toLowerCase();
    } else {
      return jswift.toLowerCase() == taj.toLowerCase();
    }
  }

  //change to sentence case
  changeToSentenceCase(str: string, control: string) {
   //console.log(str);
    if (str == null || str == undefined || str == "") {
      // do nothing
    } else {
      this.companyDirectorForm.controls[control].setValue(
        str[0].toUpperCase() + str.slice(1)
      );
      this.companyDirectorForm.get(control).value();
    }
  }

  words: string[] = [];
  capitalizeEachWord(title: string, control: string) {
    //capitlaize formtitltes and field titles
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

    this.companyDirectorForm.controls[control].setValue(title);
    return title;
  }

  result = {
    data: {
      entityId: "", //Required
      entityName: "",
      entityTRN: "",
      entityType: "",
      entityRegistrationNumber: "",
      entityRegistrationDate: "",
      email: "",
      telephone1: "",
      telephone2: "",
      telephone3: "",
      street: "",
      city: "",
      parish: "",
      jobTitle: "",
    },
  };

  assignIfValid = (controlName, dataKey) => {
    const control = this.companyDirectorForm.controls[controlName];
    if (control.dirty) {
      this.result.data[dataKey] = control.value;
    } else {
      this.result.data[dataKey] = "";
    }
  };

  updateData() {
    this.result.data.entityId = this.entityId;

    this.assignIfValid("entityName", "entityName");

    if (
      this.companyDirectorForm.controls.entityTrn.dirty &&
      this.companyDirectorForm.controls.entityTrn.value != null &&
      this.companyDirectorForm.controls.entityTrn.value !== "null"
    ) {
      this.result.data.entityTRN =
        this.companyDirectorForm.controls.entityTrn.value;
    } else {
      this.result.data.entityTRN = "";
    }

    if (
      this.companyDirectorForm.controls.entityType.dirty &&
      this.companyDirectorForm.controls.entityType.value != null &&
      this.companyDirectorForm.controls.entityType.value !== "null"
    ) {
      this.result.data.entityType =
        this.companyDirectorForm.controls.entityType.value;
    } else {
      this.result.data.entityType = "";
    }

    if (
      this.companyDirectorForm.controls.registrationNumber.dirty &&
      this.companyDirectorForm.controls.registrationNumber.value != null &&
      this.companyDirectorForm.controls.registrationNumber.value !== "null"
    ) {
      this.result.data.entityRegistrationNumber =
        this.companyDirectorForm.controls.registrationNumber.value;
    } else {
      this.result.data.entityRegistrationNumber = "";
    }

    if (
      this.companyDirectorForm.controls.registrationDate.dirty &&
      this.companyDirectorForm.controls.registrationDate.value != null &&
      this.companyDirectorForm.controls.registrationDate.value !== "null"
    ) {
      this.result.data.entityRegistrationDate =
        this.companyDirectorForm.controls.registrationDate.value;
    } else {
      this.result.data.entityRegistrationDate = "";
    }

    if (
      this.companyDirectorForm.controls.email.dirty &&
      this.companyDirectorForm.controls.email.value != null &&
      this.companyDirectorForm.controls.email.value !== "null"
    ) {
      this.result.data.email = this.companyDirectorForm.controls.email.value;
    } else {
      this.result.data.email = "";
    }

    if (
      this.companyDirectorForm.controls.telephone1.dirty &&
      this.companyDirectorForm.controls.telephone1.value != null &&
      this.companyDirectorForm.controls.telephone1.value !== "null"
    ) {
      this.result.data.telephone1 =
        this.companyDirectorForm.controls.telephone1.value;
    } else {
      this.result.data.telephone1 = "";
    }

    if (
      this.companyDirectorForm.controls.telephone2.dirty &&
      this.companyDirectorForm.controls.telephone2.value != null &&
      this.companyDirectorForm.controls.telephone2.value !== "null"
    ) {
      this.result.data.telephone2 =
        this.companyDirectorForm.controls.telephone2.value;
    } else {
      this.result.data.telephone2 = "";
    }

    if (
      this.companyDirectorForm.controls.telephone3.dirty &&
      this.companyDirectorForm.controls.telephone3.value != null &&
      this.companyDirectorForm.controls.telephone3.value !== "null"
    ) {
      this.result.data.telephone3 =
        this.companyDirectorForm.controls.telephone3.value;
    } else {
      this.result.data.telephone3 = "";
    }

    if (
      this.companyDirectorForm.controls.street.dirty &&
      this.companyDirectorForm.controls.street.value != null &&
      this.companyDirectorForm.controls.street.value !== "null"
    ) {
      this.result.data.street = this.companyDirectorForm.controls.street.value;
    } else {
      this.result.data.street = "";
    }

    if (
      this.companyDirectorForm.controls.city.dirty &&
      this.companyDirectorForm.controls.city.value != null &&
      this.companyDirectorForm.controls.city.value !== "null"
    ) {
      this.result.data.city = this.companyDirectorForm.controls.city.value;
    } else {
      this.result.data.city = "";
    }

    if (
      this.companyDirectorForm.controls.parish.dirty &&
      this.companyDirectorForm.controls.parish.value != null &&
      this.companyDirectorForm.controls.parish.value !== "null"
    ) {
      this.result.data.parish = this.companyDirectorForm.controls.parish.value;
    } else {
      this.result.data.parish = "";
    }

    if (
      this.companyDirectorForm.controls.jobTitle.dirty &&
      this.companyDirectorForm.controls.jobTitle.value != null &&
      this.companyDirectorForm.controls.jobTitle.value !== "null"
    ) {
      this.result.data.jobTitle =
        this.companyDirectorForm.controls.jobTitle.value;
    } else {
      this.result.data.jobTitle = "";
    }

   //console.log(this.result);

    this.onSubmit();
  }

  onSubmit() {
    this.error = null;
    this.message = null;
    this.userData = this.populateForm();
    this.auth.updateEntityDetails(
      this.result,
      this.updateProcessingEvent,
      this.updateResultEvent,
      this.updateErrorsEvent
    );
  }

  alert(title: string, message: string, icon: any) {
    //custom Swal alert function
    Swal.fire(title, message, icon).then((result) => {
      if (icon == "success" || icon == "info") {
        this.onBack();
      }
    });
  }

  //return error message based on form control validations
  getErrorMessage(control: string) {
    if (this.companyDirectorForm.controls[control].hasError("required")) {
      return "You must enter a value";
    }
    if (this.companyDirectorForm.controls[control].hasError("minlength")) {
      return (
        "Value must be at least " +
        this.companyDirectorForm.controls[control].errors.minlength
          .requiredLength +
        " characters"
      );
    }
    if (this.companyDirectorForm.controls[control].hasError("maxlength")) {
      return (
        "Value must be at most " +
        this.companyDirectorForm.controls[control].errors.maxlength
          .requiredLength +
        " characters"
      );
    }
    if (this.companyDirectorForm.controls[control].hasError("min")) {
      return (
        "Value must be at least " +
        this.companyDirectorForm.controls[control].errors.min.min
      );
    }
    if (this.companyDirectorForm.controls[control].hasError("max")) {
      return (
        "Value must be at most " +
        this.companyDirectorForm.controls[control].errors.max.max
      );
    }
    if (
      this.companyDirectorForm.controls[control].hasError(
        "dateNotGreaterThanTomorrow"
      )
    ) {
      return "Date cannot be after today";
    }
    if (this.companyDirectorForm.controls[control].hasError("pattern")) {
      //if control is emaill 
      if(control == "email"){
        return "Invalid email format";
      }else if(control == "telephone1" || control == "telephone2" || control == "telephone3"){
        return "Invalid phone number";
      }
    }
  }


  auditProcessingEvent: EventEmitter<boolean> = new EventEmitter();
  auditResultEvent: EventEmitter<any> = new EventEmitter();
  auditErrorsEvent: EventEmitter<any> = new EventEmitter();

  onGetAuditTrail() {
    this.auth.getRejectReasons(this.entityId, this.auditProcessingEvent, this.auditResultEvent, this.auditErrorsEvent);
  }
}
