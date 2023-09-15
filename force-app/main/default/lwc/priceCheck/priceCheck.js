import { LightningElement,track, wire } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import FORM_FACTOR from '@salesforce/client/formFactor';
import checkPrice from '@salesforce/apex/quickPriceSearch.getPricing';
import wareHouses from '@salesforce/apex/quickPriceSearch.getWarehouse';
import inCounts from '@salesforce/apex/cpqApex.inCounts';
import {newInventory,allInventory, roundNum} from 'c/helper' 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Id from '@salesforce/user/Id';
import TERM from '@salesforce/schema/Query__c.Term__c';
import SUC from '@salesforce/schema/Query__c.successful__c';
import COUNT from '@salesforce/schema/Query__c.Records_Returned__c';
import { NavigationMixin } from "lightning/navigation";
export default class PriceCheck extends NavigationMixin(LightningElement) {
    searchTerm;
    priceBook = '01s410000077vSKAAY';
    loaded; 
    formSize;
    isPinned = false; 
    showWarn = false; 
    btnLabel = 'Check Inventory';
    showInventory = false; 
    warehouse; 
    error; 
    success;
    recFound;  
    @track pinnedCards = [];
    @track prod = [];

    //get warehouse
    @wire(wareHouses)
    wiredWarehouse({ error, data }) {
        if (data) {
            let back  = data.map((item, index) =>({
                ...item, 
                label:item.Name, 
                value:item.Id
            
            }))
            back.unshift({label:'All', value:'All'})
            this.warehouseOptions = [...back]; 
            
        } else if (error) {
            this.error = error;
            console.error(this.error)
        }
    } 
    connectedCallback(){ 
        this.formSize = this.screenSize(FORM_FACTOR);
        this.loaded = true;     
    }

    screenSize = (screen) => {
        return screen === 'Large'? true : false  
    }
   
    handleKeys(evt){
        let enterKey = evt.keyCode === 13;
        if(enterKey){
            this.searchTerm = evt.target.value;
            this.handleSearch();
        }
    }
    navigateToRelatedList(item) {
        let recId = item.target.name; 
        this[NavigationMixin.Navigate]({
          type: "standard__recordRelationshipPage",
          attributes: {
            recordId: recId,
            objectApiName: "Product2",
            relationshipApiName: "ProductItems",
            actionName: "view",
          },
        });
      }

    handleSearch(){
        this.searchTerm = this.template.querySelector('[data-value="searchInput"]').value
        if(this.searchTerm.length<3){
            //add lwc alert here
            return;
        }
        this.loaded = false
        checkPrice({priceBookId: this.priceBook, searchKey: this.searchTerm})
        .then((res)=>{
                this.success = res.length > 0 ? true : false; 
                this.recFound = res.length; 
                let name;
                let cost; 
                let flr;
                let lev1;
                let lev2;
                let slug; 
                let stock;
                let allStock;
                let ProductCode;  
                let url; 
                let showPricing
                let displayPrice;
                let displayMargin; 
                this.prod = res.map(x=>{
                    name= x.Product2.Name + ' - '+ x.Product2.ProductCode,
                    cost = x.Agency_Product__c ? 'Agency' : x.Product_Cost__c,
                    flr = x.Floor_Price__c,
                    lev1 = x.Level_1_UserView__c,
                    lev2 = x.Level_2_UserView__c,
                    slug = x.Agency_Product__c ? `Agency - $${flr}`:`cost $${cost}  flr $${flr}-${x.Floor_Margin__c}%   Level 1 $${lev1}`
                    stock = x.Product2.Product_Status__c,
                    allStock = x.Product2.Total_Product_Items__c
                    ProductCode = x.Product2.ProductCode,
                    url = x.Product2Id, 
                    showPricing = false; 
                    displayPrice = x.Level_2_UserView__c
                    displayMargin = x.Level_2_Margin__c 

                    return {...x, name, cost, flr, lev1, lev2, slug, stock, allStock, ProductCode,url, showPricing, displayPrice, displayMargin}
                })

        }).then(()=>{
            const fields = {}
            fields[TERM.fieldApiName] = this.searchTerm; 
            fields[SUC.fieldApiName] = this.success;
            fields[COUNT.fieldApiName] = this.recFound;
            const recordInput = {apiName: 'Query__c', fields:fields}
            createRecord(recordInput).then((record)=>{}).catch((e)=>{
                    let warn = JSON.stringify(e);
                    console.error(warn)
            })
        }).then(()=>{
            this.loaded = true; 
            this.searchTerm = ''; 
            let x = this.template.querySelector('lightning-input').value;
            x = ''; 
            //console.log(JSON.stringify(this.prod));
            
        }).catch((e)=>{
            const evt = new ShowToastEvent({
                title: 'Error loading inventory',
                message: JSON.stringify(e),
                variant: 'warning'
            });
            this.dispatchEvent(evt);
        })
    }

    openInputs(evt){
        let targId = evt.currentTarget.dataset.name
        let index = this.prod.findIndex(x=>x.Id === targId)
        this.prod[index].showPricing = true;
    }
    closeInputs(evt){
        let targId = evt.currentTarget.dataset.close
        let index = this.prod.findIndex(x=>x.Id === targId)
        this.prod[index].showPricing = false;
    }
    pinInputs(){
        if(!this.pinnedCards[0].showPricing){
            this.pinnedCards[0].showPricing = true;
        }else{
            this.pinnedCards[0].showPricing = false;

        }
    }

    handleMargin(evt){
        window.clearTimeout(this.delay)
        let margin = Number(evt.target.value);
        let index = this.prod.findIndex(x=>x.Id === evt.target.name);
        this.delay = setTimeout(()=>{
            let cost = this.prod[index].cost;
            //console.log(1,this.prod[index].Floor_Margin__c, 2,margin, 3,this.prod[index].Floor_Margin__c < margin )
            if(this.prod[index].Floor_Margin__c > margin){
                this.prod[index].displayPrice = 'below floor'
                this.prod[index].displayMargin = margin;
            }else{
                this.prod[index].displayPrice = `$${roundNum((cost/(1- (margin)/100)), 2 )}`;
                this.prod[index].displayMargin = margin; 
            }
        },500)
        
    }
    handlePinMargin(evt){
        window.clearTimeout(this.delay)
        let margin = Number(evt.target.value);
        let index = this.pinnedCards.findIndex(x=>x.Id === evt.target.name);
        this.delay = setTimeout(()=>{
            let cost = this.pinnedCards[index].cost;
            if(this.pinnedCards[index].Floor_Margin__c > margin){
                this.pinnedCards[index].displayPrice = 'below floor'
                this.pinnedCards[index].displayMargin = margin;
            }else{
                this.pinnedCards[index].displayPrice = `$${roundNum((cost/(1- (margin)/100)), 2 )}`;
                this.pinnedCards[index].displayMargin = margin; 
            }
        },500)
    }
    fadeWarn(){
        this.showWarn = true;
        window.clearTimeout(this.delay);
        this.delay = setTimeout(()=>{
            this.showWarn = false;
        },1250)
    }
    pinCard(evt){
        let x = this.prod.find((y)=> y.Id === evt.currentTarget.dataset.pin);
        if(this.pinnedCards.length<1){
            this.pinnedCards = [...this.pinnedCards, x]
            this.isPinned = true; 
            this.prod.splice(this.prod.findIndex(a=>a.Id ===x.Id), 1)
        }else{
            this.fadeWarn();
        }
    }
    unPinCard(evt){
        let index = this.pinnedCards.findIndex(y=> y.Id === evt.currentTarget.dataset.unpin);
        this.pinnedCards.splice(index,1);
        this.isPinned = this.pinnedCards.length > 0 ? true : false;
    }
//Invetory Section
    checkInv(event){
        event.preventDefault();
        if(this.prod.length<1){
            alert('must have found at least 1 product');
            
            event.target.checked = false;
            return; 
        }
        if(!this.showInventory){ 
            this.showInventory = true; 
            this.btnLabel = 'Check Pricing';
        }else{ 
            this.showInventory = false;
            this.warehouse = ''; 
            this.btnLabel = 'Check Inventory';
        }
        
    }

    // get warehouseOptions(){
    //     return [
    //         {label:'All', value:'All'},
    //         {label: '105 | Noblesville', value:'1312M000000PB0ZQAW'}, 
    //         {label:'115 | ATS Ingalls', value:'1312M00000001nsQAA'},
    //         {label:'125 | ATS Lebanon (Parts)', value:'1312M00000001ntQAA'},
    //         {label:'200 | ATS Louisville', value:'1312M00000001nuQAA'},
    //         {label:'250 | ATS Florence', value:'1312M00000001nvQAA'},
    //         {label:'270 | ATS Winston-Salem', value:'1312M00000001nwQAA'},
    //         {label:'310 | ATS Tomball', value:'1312M000000PB6AQAW'},
    //         {label:'360 | ATS Nashville', value:'1312M00000001nxQAA'},
    //         {label:'400 | ATS Columbus', value:'1312M00000001nyQAA'},
    //         {label:'415 | ATS Sharonville', value:'1312M00000001nzQAA'},
    //         {label:'440 | ATS Lewis Center', value:'1312M00000001o0QAA'},
    //         {label:'450 | ATS Brecksville', value:'1312M00000001o1QAA'},
    //         {label:'470 | ATS Boardman', value:'1312M00000001o2QAA'},
    //         {label:'510 | ATS Travis City', value:'1312M00000001o3QAA'},
    //         {label:'520 | ATS Farmington Hills', value:'1312M00000001o4QAA'},
    //         {label:'600 | ATS - Elkhart', value:'1312M00000001o5QAA'},
    //         {label:'710 | ATS - St. Peters', value:'1312M00000001o6QAA'},
    //         {label:'720 | ATS - Cape Girardeau', value:'1312M00000001o7QAA'},
    //         {label:'730 | ATS - Columbia', value:'1312M00000001o8QAA'},
    //         {label:'770 | ATS - Riverside', value:'1312M00000001o9QAA'},
    //         {label:'790 | ATS - Springfield', value:'1312M0000004D7IQAU'},
    //         {label:'820 | ATS - Wheeling', value:'1312M000000PB0UQAW'},
    //         {label:'850 | ATS - Madison', value:'1312M00000001oAQAQ'},
    //         {label:'860 | ATS - East Peoria', value:'1312M000000PB2BQAW'},
    //         {label:'960 | ATS - Monroeville', value:'1312M00000001oBQAQ'},
    //         {label:'980 | ATS - Ashland', value:'1312M00000001oCQAQ'},
    //         {label:'999 | ATS - Fishers', value:'1312M000000PB3FQAW'}
    //     ];
    // }

    async checkInventory(locId){
        this.warehouse = locId.detail.value; 
        this.loaded = false;
        let data = this.isPinned ? [...this.prod, ...this.pinnedCards] : [...this.prod];
        let pcSet = new Set();
        let prodCodes = [];
        try{
            data.forEach(x=>{
                pcSet.add(x.ProductCode);
            })
            prodCodes = [...pcSet];

            let inCheck = await inCounts({pc:prodCodes, locId:this.warehouse});
           console.log('inCheck ' +JSON.stringify(inCheck));
            this.prod = this.warehouse === 'All' ? await allInventory(data, inCheck) : await newInventory(data, inCheck);
            if(this.isPinned){
                let back = this.isPinned = true ? this.prod.find(x => x.Id === this.pinnedCards[0].Id) : '';
                this.prod.splice(this.prod.findIndex(a=>a.Id ===this.pinnedCards[0].Id), 1) 
                this.pinnedCards[0].allStock = back?.allStock ?? 'not found'; 
                this.pinnedCards[0].wInv = back?.wInv ?? 'not found'; 
            }
             
            
            //console.log(JSON.stringify(this.prod)); 
        }catch(error){
            console.log(error)
            this.error = error;
            const evt = new ShowToastEvent({
                title: 'Error loading inventory',
                message: this.error,
                variant: 'warning'
            });
            this.dispatchEvent(evt);
        }finally{
            this.loaded = true;
        }    
        
    }
}