import {Component, EventEmitter, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {UserManagementService} from '../../../modules/user-management-module/user-management.service';
import {Router} from '@angular/router';
import {DataServiceError} from '../../../core/helpers/http/HttpModel';
import {NavigationComponentType} from '../../../shared/service/tree.service';
import {NavigationItem, NavigationService} from '../../../shared/service/navigation.service';
import {ParamService} from '../../../shared/service/param.service';
import { CompanyDirectorDetails } from '../../models/companyDirector.model';
import {ActivatedRoute} from '@angular/router';
import {AttachmentService} from '../../../shared/forms/attachment-form/attachment.service';
import {DatePipe, JsonPipe} from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpUtils } from 'src/app/core/helpers/http/HttpUtils';
import Swal from 'sweetalert2';
import { agentRelationshipModel } from '../../models/agentRelationship.model';



@Component({
  selector: 'app-entity-agent-details',
  templateUrl: './entity-agent-details.component.html',
  styleUrls: ['./entity-agent-details.component.css']
})
export class EntityAgentDetailsComponent implements OnInit {


  

  public static defineNavigation() {
    return {
      id: 'entity-agent-details',
      component: EntityAgentDetailsComponent,
      tabTitle: 'Entity Agent Details',
      windowTitle: 'Single Window',
      singleton: true,
      accessors: ['Admin.user'],
      params: null
    };
  }

    constructor(private rs: UserManagementService, private route: ActivatedRoute, private router: Router, private urlData: ParamService, private nav: NavigationService, private _atService: AttachmentService, public datepipe: DatePipe, public fb: FormBuilder, public http: HttpUtils) { }

  private sub: any;
  private incomingData: any;
  private entityStatus: any;

  filtersLoaded: Promise<boolean>;
  public navItem: NavigationItem;
  itemArray: Array<NavigationComponentType> = [];
  viewSingleDirectorCompany: CompanyDirectorDetails;



  
  processingEvent: EventEmitter<boolean> = new EventEmitter();
  errorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  resultEvent: EventEmitter<any> = new EventEmitter();
  updateEvent: EventEmitter<any> = new EventEmitter();


  filesForm: FormGroup;
  contactForm: FormGroup;
  error: any;
  path: string;
  message: any;
  loading = true;

  $processingEvent: EventEmitter<boolean> = new EventEmitter();
  $errorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  $resultEvent: EventEmitter<any> = new EventEmitter();
  $initEvent: EventEmitter<any> = new EventEmitter();
  hasUploadedFiles: boolean = false;



  entityName = '';
  companyAgents = [];
  entityProcessingEvent: EventEmitter<boolean> = new EventEmitter();
  entityErrorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  entityResultEvent: EventEmitter<any> = new EventEmitter();


  agentProcessingEvent: EventEmitter<boolean> = new EventEmitter();
  agentErrorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();
  agentResultEvent: EventEmitter<any> = new EventEmitter();


  removeAgentProcessingEvent: EventEmitter<boolean> = new EventEmitter();
  removeAgentResultEvent: EventEmitter<any> = new EventEmitter();
  removeAgentErrorsEvent: EventEmitter<DataServiceError[]> = new EventEmitter();


      
  dtOptions: DataTables.Settings = {};
  dtTrigger = new Subject();
  pageDisabled: boolean = false;

  formLoading: boolean = true;
  formResult: any;
  formError: Boolean = null;
  formErrorMessage: String = null;
  agentTRN: string;
  agentID: string;
  

  ngOnInit() {

    this.dtOptions = {
      pageLength: 10,
      columnDefs: [
        { targets: 5, type: 'date' },
        { targets: 6, type: 'date' }
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

    this.resultEvent.subscribe(result => {
      if (result.data) {

        this.viewSingleDirectorCompany = result.data;
        this.setEntityTRN(this.viewSingleDirectorCompany.companyTrn);
        this.getAgents(this.entityTRN);
        this.entityName = this.viewSingleDirectorCompany.name;
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

    this.processingEvent.subscribe(processing => {
      this.formLoading = processing;
    });

    this.entityResultEvent.subscribe(result => {
      if (result.data) {
        console.log('entity agents');
        console.log(result.data.entities);

        if(result.data.entities.length != 0){
          this.companyAgents = result.data.entities;
          this.setAgentTRN(this.companyAgents[0].trn);
        }


        //sort entity employees by date
        this.companyAgents.sort((a, b) => new Date(this.formatDate(b.startDate)).getTime() - new Date(this.formatDate(a.startDate)).getTime());
    
        console.log('entity agents');
        console.log(this.companyAgents);
        this.dtTrigger.next();
      }
    });


    // remove events

  this.removeAgentResultEvent.subscribe(result => {
    Swal.fire( "Agent Removed", result.data, "success").then((result)=> {
      this.onBack();
    });
  });
 
      


  this.removeAgentErrorsEvent.subscribe(error => { 
    if(error){
      console.log(error);
      this.alert('Error', error[0].message, 'error');
    }
   });

  this.removeAgentProcessingEvent.subscribe(processing => { });


    //remove events end


    this.entityErrorsEvent.subscribe(error => {
      this.error = error;
    });

    this.entityProcessingEvent.subscribe(processing => {
      this.loading = processing;
    });



    this.initViewSingle();
  }


  private initViewSingle() {
    this.rs.getSingleRegisteredDirector(this.sub, this.processingEvent, this.resultEvent, this.errorsEvent);
  }

  private getAgents(entityTrn: string) {
    this.rs.getMyAgents(this.entityTRN, this.entityProcessingEvent, this.entityResultEvent, this.entityErrorsEvent);
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


  setAgentID(agentID: string){
    this.agentID = agentID;
  }

  setEntityTRN(entityTrn: string){
    this.entityTRN = entityTrn;
  }

  setAgentTRN(index: number){
    this.agentTRN = this.companyAgents[index].code;
    console.log('set agent trn');
    console.log(this.agentTRN);
  }

  getAgentTRN(){
    return this.agentTRN;
  }

  

  companyDirectorForm = new FormGroup({
      entityName: new FormControl('', Validators.required),
      entityTrn: new FormControl('', Validators.compose([Validators.required, Validators.minLength(13), Validators.maxLength(13)])),
     
  });



  //convert string date to yyyy-MM-dd
  formatDate(date: Date) {
    let formatDate = new Date(date).toISOString().slice(0, 10).toString();
    ////console.log(formatDate);
    return formatDate;
  }

  entityTRN: string;


    getEntityEmployees(entityTrn){
    this.rs.getMyAgents(entityTrn, this.entityProcessingEvent, this.entityResultEvent, this.entityErrorsEvent);
  }

  removeEmployee(agentTRN: number, entityTrn: string) {
    this.rs.deleteAgent(agentTRN ,this.removeAgentProcessingEvent, this.removeAgentResultEvent, this.removeAgentErrorsEvent);
    // this.rs.deleteAgent(agentTRN, entityTrn ,this.agentProcessingEvent, this.agentResultEvent, this.agentErrorsEvent);
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




  onUpdateAgent() {
    const formData = new FormData;

    let today = new Date();
      const agentData = {
        "data": {
          'agentCod': this.getAgentTRN(),
          'clientCod': this.entityTRN,
          'validFrom': this.formatDate(this.companyAgents[0].startDate),
          'validTo' : today.toISOString().slice(0, 10).toString(),
          'flagDisable': '0'
        }
      }
    return agentData;
  }

  removeAgent() {
      console.log('remove agent');
      console.log(this.onUpdateAgent());
     this.rs.updateAgentRelationship(this.onUpdateAgent(), this.removeAgentProcessingEvent, this.removeAgentResultEvent, this.removeAgentErrorsEvent)
  }




}