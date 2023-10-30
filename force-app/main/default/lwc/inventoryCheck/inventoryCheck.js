import { LightningElement, wire  } from 'lwc';

import getWarehouses from '@salesforce/apex/lwcHelper.getWarehouse';
import userWareHouse from '@salesforce/apex/lwcHelper.userLocation';
import warehouseInventory from '@salesforce/apex/quickPriceSearch.warehouseInventory';
//import getPickListValues from '@salesforce/apex/lwcHelper.getPickListValues'
import multiplePicklists from '@salesforce/apex/lwcHelper.multiplePicklists2'
import userId from '@salesforce/user/Id';
import FORM_FACTOR from '@salesforce/client/formFactor';
import LightningAlert from 'lightning/alert';

export default class InventoryCheck extends LightningElement {
    userwareHouseNumb;
    userId = userId; 
    selWareHouse; 
    formSize;
    prodData; 
    loaded = false; 
    recordTypeId
    subCat = 'All';
    primCat = 'All'; 
    primaryValues
    subValues
    showCats = false; 

    async handleAlertClick() {
        await LightningAlert.open({
            message: 'Please enter a category or search term',
            theme: 'error', // a red theme intended for error states
            label: 'Narrow Search', // this is the header text
        });
    }
    connectedCallback(){
        this.formSize = this.screenSize(FORM_FACTOR);
        this.init(); 
    }
    screenSize = (screen) => {
        return screen === 'Large'? true : false  
    }

    async init(){
        let back = await getWarehouses()
        this.userwareHouseNumb = await userWareHouse({userId: this.userId});
        //let funStart = performance.now(); 
        //multiplePicklists pass in single object in objectName then all picklist fields you want back
        //whatever fieldname you pass that will come back as a key with the picklist labels and values as value 
        //there also is a single picklist method in same class getPickListValues works same way except you pass one field 
        let picVals = await multiplePicklists({objectName:'Product2', picklistFields:'Primary_Category__c,Subcategory__c'})
        this.primaryValues = picVals.Primary_Category__c;
        this.subValues = picVals.Subcategory__c; 
        //let funStop = performance.now();
        //console.log(1,test)
        //let pickListStart = performance.now();
        //this.primaryValues = await getPickListValues({objName: 'Product2', fieldAPI: 'Primary_Category__c'});
        //this.subValues = await getPickListValues({objName: 'Product2', fieldAPI:'Subcategory__c'})
        this.primCat = this.primaryValues[0].value;  
        //let pickListEnd = performance.now();
        let mapped = await back.map((item, index) =>({
                                    ...item, 
                                    label:item.Name, 
                                    value:item.Id
                    
                                }))
        mapped.unshift({label:'All', value:'All'})
        this.warehouseOptions = [...mapped]; 
        let start = this.warehouseOptions.filter((x)=> x.label.includes(this.userwareHouseNumb))
        this.selWareHouse = start[0].value ? start[0].value : this.warehouseOptions[0].value; 
        this.loaded = true; 
        //console.log(`test time: ${funStop - funStart}`);
        //console.log(`Picklist Time: ${pickListEnd- pickListStart}`);
        
    }

    handleKeys(evt){
        let enterKey = evt.keyCode === 13;
        if(enterKey){
            this.searchTerm = evt.target.value;
            this.handleSearch();
        }
    }

    changeWarehouse(locId){
        this.selWareHouse = locId.detail.value;
    }

   async handleSearch(){
    this.loaded = false;     
        this.searchTerm = this.template.querySelector('[data-value="searchInput"]').value
        let searchString = this.buildSearchString(this.searchTerm); 
        //console.log(y)
            if(this.searchTerm.length<3 && this.subCat === 'All' && this.primCat ===undefined){
                //add lwc alert here
                this.handleAlertClick();
                this.loaded = true; 
                return;
        }
        let query = await warehouseInventory({query: searchString});
        this.prodData = query.map((item)=>({
            ...item,
            name: item.Product2.Name + ' ' + item.Product_Code__c,
            allocated: item.Quantity_Allocated__c === undefined? 0 : item.Quantity_Allocated__c,
           // inv: `On Hand: ${item.QuantityOnHand}   Allocated: ${allocated}   Available: ${item.Quantity_Available__c}`,
            url: 'https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Product2/'+item.Product2Id+'/related/ProductItems/view'
            //url: `https://advancedturf.lightning.force.com/lightning/r/ProductItem/${item.Product2Id}/view`
        }))
        this.loaded = true; 
    }

    setPrime(x){
        this.primCat = x.detail.value
    }
    setSub(x){
        this.subCat = x.detail.value; 
    }
    handleShowCats(){
        this.showCats = this.showCats ? false : true; 
    }
    buildSearchString(term){
        let prodClass= 'Simple';
        let string = 'select Total_Product_Items__c, Product_Code__c, Quantity_Allocated__c, Quantity_Available__c,QuantityOnHand, '+
                    `Product2.Name, Product2.Product_Status__c, Product2Id `+
                     `from ProductItem where Product_Class__c = '${prodClass}'`
        string += term.length > 0 ? ` and (Product_Code__c like '%${term}%' or Product2.Name like '%${term}%')` : ''
        string += this.subCat != 'All' ?  ` and Product2.Subcategory__c = '${this.subCat}'` : '';
        string += this.primCat != 'All' ?  ` and Product2.Primary_Category__c = '${this.primCat}'` : ''; 
        string += this.selWareHouse != 'All' ? ` and LocationId = '${this.selWareHouse}'` : ''; 
        string +=   ` order by  Product2.Product_Status__c, Quantity_Available__c desc nulls last`
                     return string;  
    }
}
