@isTest
public class test_quickPriceSearch {
@isTest
    static void Test_quickPriceSearch(){
        //date for opp
        Date myDate = Date.newInstance(2040, 1, 4);
        //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
        //product creation
        Id pricebook = Test.getStandardPricebookId();

        product2 prod = new product2(name ='product', IsActive= True, ProductCode='123', Product_Status__c ='Stock', 
                                    Subcategory__c='Chemicals-Herbicide', Product_Family__c='FMC', Floor_Type__c ='Floor', Floor_Price__c = 100); 
        insert prod; 
        
        product2 prod2= new product2(name ='widget', IsActive= True, ProductCode='321', Product_Status__c ='Stock', 
                                    Subcategory__c='Fungicide', Product_Family__c='FoliarPak', Floor_Type__c ='Floor', Floor_Price__c = 100); 
        insert prod2;
        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebook, Product2Id=prod.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe2 = new PricebookEntry(Pricebook2Id = pricebook, Product2Id=prod2.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);

        insert pbe;
        insert pbe2;
        
        Schema.Location loc = new Schema.Location(Name='Ats', Location_Number__c='114', LocationType='ATS', IsInventoryLocation=True);
        insert loc; 
        
        ProductItem pi = new ProductItem(Product2Id = prod.id,LocationId=loc.id, QuantityOnHand=12);
        insert pi; 
        
       string querySearch = 'select id from ProductItem';  
        system.debug(querySearch);
        Test.startTest();
        	List<PricebookEntry> nameOnly = quickPriceSearch.getPricing(priceBook, 'Widget');
        	List<PricebookEntry> code = quickPriceSearch.getPricing(priceBook, '321');
        	list<productitem> counterSearch = quickPriceSearch.warehouseInventory(querySearch); 
        Test.stopTest();
        system.assertNotEquals(null, nameOnly);
        system.assertNotEquals(null, code);
        system.assertNotEquals(null, counterSearch);
    } 
    @isTest
    static void Test_getWarehouse(){
        Schema.Location warehouse = new Schema.Location();
        warehouse.Name= 'ATS Warehouse';
        warehouse.Location_Number__c ='2';
        warehouse.IsInventoryLocation = true; 
        warehouse.LocationType = 'ATS'; 
        
        insert warehouse; 
        
        //VG Warehouse
        Schema.Location vgwarehouse = new Schema.Location();
        vgwarehouse.Name= 'VG Warehouse';
        vgwarehouse.Location_Number__c ='VG1';
        vgwarehouse.IsInventoryLocation = true; 
        vgwarehouse.LocationType = 'VG'; 
        
        insert vgwarehouse;
        
        Test.startTest();
        	list<Schema.Location> stores = quickPriceSearch.getWareHouse(); 
        list<Schema.Location> vgstores = quickPriceSearch.getVGWarehouse();
        Test.stopTest();
        system.assertEquals(1, stores.size());  
    }
     @isTest
    static void Test_getLastQuote2(){
        //date for opp
        Date myDate = Date.newInstance(2040, 1, 4);
        //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
        //product creation
        Id pricebookId = Test.getStandardPricebookId();
        pricebook2 vgPriceBook = new priceBook2(Name = 'VG Price Book', isActive = True, Valley_Green__c = true);
        insert vgPriceBook; 
        
        //create product2 that is active
        product2 prod = new product2(name ='product', IsActive= True, ProductCode='alex'); 
        insert prod; 
        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=prod.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert pbe; 
        
        //create product2 that will be deactivated
        product2 widget = new product2(name ='widget', IsActive= True, ProductCode='abby'); 
        insert widget; 
        
        PricebookEntry widgetpbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=widget.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert widgetpbe; 
        //create test opportunity
        opportunity opp = new opportunity(name = 'test name', accountID= cust.id, pricebook2id = pricebookId,
                                         stagename='Estimate(10%)', job_type__c = 'Construction', closedate = myDate);
       
        //insert w/o synced quote
        insert opp; 
       
//opportunitylineitem
        opportunitylineitem li = new opportunitylineitem(opportunityid = opp.id, product2id = prod.Id, PricebookEntryId=pbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c=4, CPQ_Margin__c=32); 
        insert li; 
        
        opportunitylineitem widgetli = new opportunitylineitem(opportunityid = opp.id, product2id = widget.Id, PricebookEntryId=widgetpbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c=75, CPQ_Margin__c=35); 
        insert widgetli;
        list<opportunitylineitem> olt = [select  fields(STANDARD) from opportunitylineitem where opportunityid =: opp.id];
        system.debug(olt);
//Insert Second Opp
        opportunity opp2 = new opportunity(name = 'opp2', accountID= cust.id, pricebook2id = pricebookId,
                                         stagename='Estimate(10%)', job_type__c = 'Construction', closedate = myDate);
        insert opp2; 
        
//Insert Opp Prod 2
//opportunitylineitem
        opportunitylineitem li2 = new opportunitylineitem(opportunityid = opp2.id, product2id = prod.Id, PricebookEntryId=pbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c=5, CPQ_Margin__c=32); 
        insert li2; 
        opportunitylineitem widgetli2 = new opportunitylineitem(opportunityid = opp2.id, product2id = widget.Id, PricebookEntryId=widgetpbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c=100, CPQ_Margin__c=35); 
        insert widgetli2;
  ///list for product codes
       List<String> pc = new List<String>();
	Test.startTest();
        pc.Add(prod.ProductCode);
        pc.Add(widget.ProductCode);
        OpportunityLineItem oneLine = cpqApex.getLastQuote(cust.ID, 'alex', opp2.id);
        list<OpportunityLineItem> multiple = cpqApex.onLoadGetLastQuoted(cust.Id, pc, opp2.id);
        list<Pricebook2> vgPb = quickPriceSearch.vgPriceBooks();
    Test.stopTest();
        
        list<opportunity> pop = [select id, name from opportunity where AccountId =: cust.id]; 
        
    }
    
    @isTest
    static void Test_inventory(){
        product2 widget = new product2(name ='widget', productcode='123', IsActive= True); 
        insert widget; 
        product2 widget2 = new product2(name ='widget2', productcode='456', IsActive= True); 
        insert widget2; 
        //Location only wont work on this object need to do as below. 
        //https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_system_Location.htm
        Schema.Location warehouse = new Schema.Location(Name='Warehouse', LocationType='Warehouse', IsInventoryLocation=True);
        insert warehouse;
        
        Schema.Location vgwarehouse = new Schema.Location(Name='VG Warehouse', LocationType='Warehouse', IsInventoryLocation=True);
        insert vgwarehouse;
        
        ProductItem inven1 = new ProductItem(Product2Id= widget.id,LocationId =warehouse.id, QuantityOnHand=1);
        insert inven1;
        
        ProductItem inven2 = new ProductItem(Product2Id= widget2.id,LocationId =warehouse.id, QuantityOnHand=2);
        insert inven2;
        
        ProductItem vginven1 = new ProductItem(Product2Id= widget.id,LocationId = vgwarehouse.id, QuantityOnHand=1);
        insert vginven1;
        
        ProductItem vginven2 = new ProductItem(Product2Id= widget2.id,LocationId = vgwarehouse.id, QuantityOnHand=2);
        insert vginven2;
        string pc1 = '123';
        string pc2 = '456';
        list<string> pcList = new list<string>();
        pcList.add(pc1);
        pcList.add(pc2); 
        
        Test.startTest();
        	list<id> idList = new list<id>();
        	idList.add(widget.Id);
        	idList.add(widget2.Id);
        	list<productitem> changeInventory = quickPriceSearch.inCounts(pcList, warehouse.id); 
        	list<productitem> changeInventoryAll = quickPriceSearch.inCounts(pcList, 'All'); 
        	
        	list<productitem> vgInventory = quickPriceSearch.inVGCounts(pcList, vgwarehouse.id);
        	list<productitem> vgInventoryAll = quickPriceSearch.inVGCounts(pcList, 'All');
        Test.stopTest();
    }
@isTest
    static void test_vgSearch(){
        pricebook2 vgPriceBook = new priceBook2(Name = 'VG Price Book', isActive = True, Valley_Green__c = true);
        insert vgPriceBook; 
        
        product2 widget = new product2(name ='widget', IsActive= True, ProductCode='alex', Valley_Green__c = True); 
        insert widget; 
        
        PricebookEntry widgetpbe = new PricebookEntry(Pricebook2Id = vgPriceBook.Id, Product2Id=widget.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        
        product2 widget2 = new product2(name ='widget2', IsActive= True, ProductCode='abby', Valley_Green__c = True); 
        insert widget2; 
        
        PricebookEntry widgetpbe2 = new PricebookEntry(Pricebook2Id = vgPriceBook.Id, Product2Id=widget2.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        test.startTest();
        	list<string> pricebooks = new list<string>();
        	pricebooks.add(vgPriceBook.Id);
        	string searchT = 'widget';
        	list<PricebookEntry> back = quickPriceSearch.vgGetPricing(pricebooks, searchT);
        test.stopTest();
        
    }
}