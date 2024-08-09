import {Component, EventEmitter, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {EmployeeReviewModel} from '../../../shared/models/companyEmployee.model';
import {UserManagementService} from '../../../modules/user-management-module/user-management.service';
import {Router} from '@angular/router';
import {DataServiceError} from '../../../core/helpers/http/HttpModel';
import {NavigationComponentType} from '../../../shared/service/tree.service';
import {NavigationItem, NavigationService} from '../../../shared/service/navigation.service';
import {ParamService} from '../../../shared/service/param.service';
import {EntityList} from '../../../shared/models/entity-list.model';
import {EmployeeStat} from '../../../shared/models/registration.model';
import {DataTableDirective} from 'angular-datatables';
import {roleUpdateEmployee} from '../../../shared/models/roleUpdate.model';
import {AssessmentModel} from '../../../shared/models/assessment.model';
import { CompanyDirectorDetails } from '../../models/companyDirector.model';
import {ActivatedRoute} from '@angular/router';
import {UserStatus} from '../../../shared/models/registration.model';
import {
  CojDirectorModel,
  CompanyDirectorModel,
  CompanyFiles, DirectorsModel
} from '../../../shared/models/companyDirector.model';
import Swal from 'sweetalert2';
import {environment} from '../../../../environments/environment';
import {AttachmentService} from '../../../shared/forms/attachment-form/attachment.service';
import {DatePipe} from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {BsDatepickerConfig, BsDatepickerViewMode} from 'ngx-bootstrap/datepicker';
import { HttpUtils } from 'src/app/core/helpers/http/HttpUtils';
import {DataRequest} from '../../../core/helpers/http/HttpModel';
import { EmployerModel } from '../../models/employer.model';
import { title } from 'process';




@Component({
  selector: 'app-entity-employee-details',
  templateUrl: './entity-employee-details.component.html',
  styleUrls: ['./entity-employee-details.component.css']
})
export class EntityEmployeeDetailsComponent implements OnInit {




  public static defineNavigation() {
    return {
      id: 'entity-employee-details',
      component: EntityEmployeeDetailsComponent,
      tabTitle: 'Entity Chief Details',
      windowTitle: 'Single Window',
      singleton: true,
      accessors: ['Admin.user'],
      params: null
    };
  }

  constructor(private rs: UserManagementService, private route: ActivatedRoute, private router: Router, private urlData: ParamService, private nav: NavigationService, private _atService: AttachmentService, public datepipe: DatePipe, public fb: FormBuilder, public http: HttpUtils) { }

  private sub: any;
  private entityStatus: any;
  userId;
  endpoint = environment.applicationServerURL + '/director/application/uploads';
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

  cojDirector: CojDirectorModel;
  directors: DirectorsModel[];
  processingEvent: EventEmitter<boolean> = new EventEmitter();
  errorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  resultEvent: EventEmitter<any> = new EventEmitter();
  updateEvent: EventEmitter<any> = new EventEmitter();
  rejectEvent: EventEmitter<any> = new EventEmitter();
  fileDownloadResultEvent: EventEmitter<any> = new EventEmitter();


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
  files: FormArray;
  fileData: Array<File> = [];
  docType: Array<string> = [];
  private readonly companyDirectorModel: CompanyDirectorModel;
  minMode: BsDatepickerViewMode = 'day';
  bsConfig: Partial<BsDatepickerConfig>;

  $processingEvent: EventEmitter<boolean> = new EventEmitter();
  $errorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  $resultEvent: EventEmitter<any> = new EventEmitter();
  $initEvent: EventEmitter<any> = new EventEmitter();


// 
  private data: any;
  countries: [];
  parishes: [];
  incomingData: any;

  hasUploadedFiles: boolean = false;



  entityName = '';
  companyEmployees = [];
  entityProcessingEvent: EventEmitter<boolean> = new EventEmitter();
  entityErrorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  entityResultEvent: EventEmitter<any> = new EventEmitter();

  removeEntityProcessingEvent: EventEmitter<boolean> = new EventEmitter();
  removeEntityErrorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  removeEntityResultEvent: EventEmitter<any> = new EventEmitter();


      
  dtOptions: DataTables.Settings = {};
  dtTrigger = new Subject();
  private datatableElement: DataTableDirective;
  pageDisabled: boolean = false;

  employeeTRN: string = "";

  
  formLoading: boolean = true;
  formResult: any;
  formError: Boolean = null;
  formErrorMessage: String = null;

  removeEntityMessage: string = null;
  removeEntityError: Boolean = null;
  


  ngOnInit() {
    this.dtOptions = {
      pageLength: 10,
      columnDefs: [
        { targets: 5, type: 'date' },
      ],
      order: [[5, 'desc']]
    };

    this.urlData.itemArrayVal.subscribe(itemArray => this.itemArray = itemArray);
    this.urlData.urlData.subscribe(sub => this.incomingData = sub);

    this.sub = this.incomingData.split(',')[0];
    this.entityStatus = this.incomingData.split(',')[1];
    console.log(this.incomingData);
    console.log(this.sub);
    console.log(this.entityStatus);


    if(this.entityStatus != 1){
     
      this.pageDisabled = true;
    }

    this.processingEvent.subscribe(result => {
      this.formLoading = result;
      console.log('processing event');
       console.log(result);
   });
  

    this.resultEvent.subscribe(result => {

      if (result.data != null || result.data != undefined) {

        this.viewSingleDirectorCompany = result.data;
      
        this.employeeTRN = this.viewSingleDirectorCompany.companyTrn,
        this.setemployeeTRN( this.viewSingleDirectorCompany.companyTrn);
        console.log('result for company');
        console.log(this.viewSingleDirectorCompany);
        this.getEmployees(this.employeeTRN);
        this.entityName = this.viewSingleDirectorCompany.name;
        this.employeeTRN = this.viewSingleDirectorCompany.companyTrn
        this.filtersLoaded = Promise.resolve(true);
        this.loading = false;
        
      }
    });

    
    this.errorsEvent.subscribe(result => {
      if(result.length > 0){
        this.formError = true;
        this.formErrorMessage = result[0].message;
      }
    });

    this.entityResultEvent.subscribe(result => {
      if (result.data != null) {
        console.log('entity employees');
        console.log(result.data.empList);
        this.companyEmployees = result.data.empList;

        //sort entity employees by date
        this.companyEmployees.sort((a, b) => new Date(this.formatDate(b.dateCreated)).getTime() - new Date(this.formatDate(a.dateCreated)).getTime());
    
        console.log('entity employees');
        this.dtTrigger.next();

      }else{
        this.companyEmployees = [];
      }
    });



    this.removeEntityResultEvent.subscribe(result => {
      if (result.data) {
        this.removeEntityMessage= result.data;
        this.alert('Employee Removed', result.data, 'success');
      }
    });

    this.removeEntityProcessingEvent.subscribe(result => {

    });

    this.removeEntityErrorsEvent.subscribe(result => {
      if(result.length > 0){
        this.removeEntityError = true;
        this.removeEntityMessage = result[0].message;


        this.alert('Error', this.removeEntityMessage, 'error');

      }
        
      
    });







    this.entityErrorsEvent.subscribe(error => {
      this.error = error;
    });

    this.entityProcessingEvent.subscribe(processing => {
      this.loading = processing;
    });



    this.initViewSingle();

    if(this.loading == false){
      this.getEmployees(this.employeeTRN);
    }

  }


    
    private initViewSingle() {
      this.rs.getSingleRegisteredDirector(this.sub, this.processingEvent, this.resultEvent, this.errorsEvent);
    }

    private getEmployees(employeeTRN: any) {
      if (employeeTRN != null || employeeTRN != undefined || employeeTRN != ''){
        this.rs.getApprovedEmployee(employeeTRN, this.entityProcessingEvent, this.entityResultEvent, this.entityErrorsEvent);
      }
    }

  

    onAddItem(key: string) {
      this.navItem = { id: key, params: 0};
      this.nav.navigate(this.navItem);
    }
    closeTab() {
      this.itemArray.splice(this.itemArray.length - 1, 1);
      this.urlData.changeArray(this.itemArray);
    }
    onBack(){
      this.closeTab();
      this.onAddItem('admin.company');
    }


    //convert string date to yyyy-MM-dd
    formatDate(date: Date) {
      let formatDate = new Date(date).toISOString().slice(0, 10).toString();
      ////console.log(formatDate);
      return formatDate;
    }

    updateForm(){


      this.onBack();

    }



      getEntityEmployees(employeeTRN){
      this.rs.getApprovedEmployee(employeeTRN, this.entityProcessingEvent, this.entityResultEvent, this.entityErrorsEvent);
    }

    employeeTrn: string;
    setEmployeeTRN(index: string){
      this.employeeTrn = this.companyEmployees[index].employeeTrn;
      console.log('employee trn set: ' + this.employeeTrn);
      
    }

    getEmployeeTRN(){

      return this.employeeTrn;
    }

    setemployeeTRN(employeeTRN: string){
      this.employeeTRN = employeeTRN;
    }

    removeEmployee(empTrn: string, employeeTRN: string) {

      console.log('remove employee');
      console.log(empTrn);
      console.log(employeeTRN);

      if(empTrn == null || empTrn == undefined || employeeTRN == '' || employeeTRN == undefined){
        this.alert('Error', 'Error removing this employee', 'error');
      }else{
        this.rs.deleteEmployee(empTrn, employeeTRN, this.removeEntityProcessingEvent, this.removeEntityResultEvent, this.removeEntityErrorsEvent);

      }
    }


    alert(title: string, message: string, icon: any){

      Swal.fire( title, message, icon, ).then((result)=> {

        if(icon == 'success' || icon == 'info'){
          this.onBack();
          console.log('swal result');
          console.log(result);
          console.log(result.value);
        }else{
          //do nothing
          console.log("");
          console.log(result.value)
        }
      });
    }




}

